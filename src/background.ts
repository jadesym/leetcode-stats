import { GET_SUBMISSIONS_REQUEST_TYPE } from './requests/types';
import { GET_SUBMISSIONS_RESPONSE_TYPE, SubmissionArray } from './responses/types';
import { MessageResponseType } from './common/message';
import { LEETCODE_TAB_PORT_NAME } from './common/constants';

const DEFAULT_POLLING_RATE_IN_MINUTES = 3;
const DEFAULT_POLLING_RATE = 1000 * 60 * DEFAULT_POLLING_RATE_IN_MINUTES;
const LEETCODE_URL_MATCH = "*://leetcode.com/*";
const LEETCODE_DOMAIN = "leetcode.domain";

enum Colors {
  Red = "#ff0000",
  Green = "#3cb371",
  Yellow = "#eedc00"
}

const COLOR_THRESHOLDS = {
  0: Colors.Red,
  2: Colors.Yellow,
  5: Colors.Green
}

function setBadgeText(inputString: string, color: Colors): void {
  console.log(`Set badge text to [${inputString}] with color [${color}] at time [${new Date().toLocaleString()}]`);
  chrome.action.setBadgeBackgroundColor({ color });
  chrome.action.setBadgeText({ text: inputString });
}

function isWithinCurrentDay(timestampInSeconds: number): boolean {
  const inputDate = new Date(timestampInSeconds * 1000);
  inputDate.setHours(inputDate.getHours() - 6);
  const currentDate = new Date();
  currentDate.setHours(currentDate.getHours() - 6);

  return inputDate.getDate() == currentDate.getDate();
}

async function sendMessage(tabId: number): Promise<MessageResponseType> {
  return await new Promise((resolve, reject) => {
    chrome.tabs.sendMessage(tabId, { type: GET_SUBMISSIONS_REQUEST_TYPE }, (response) => {
      if (chrome.runtime.lastError) {
        reject(chrome.runtime.lastError);
      } else {
        resolve(response);
      }
    });
  });
}

async function sendGetSubmissionsMessage() {
  const tabs = await chrome.tabs.query({ status: "complete", url: LEETCODE_URL_MATCH });

  if (tabs.length <= 0) {
    console.log(`Unable to find any tabs that match url: ${ LEETCODE_DOMAIN }. Try opening & logging in to a ${LEETCODE_DOMAIN} tab. Retrying in ${DEFAULT_POLLING_RATE_IN_MINUTES} minutes.`)
    setBadgeText('-', Colors.Red);
    return;
  } else {
    let hasMessageSendSucceeded = false;

    for (const currentTab of tabs) {
      if (hasMessageSendSucceeded) {
        break;
      }

      let response: MessageResponseType;
      try {
        response = await sendMessage(currentTab.id);
      } catch (err) {
        // Pass on this err for now; it's likely due to tab needing to be refreshed and not necessarily an error.
        // console.error(err);
        continue;
      }

      if (response !== undefined && response.wasReceived) {
        hasMessageSendSucceeded = true;
      }
    }

    if (!hasMessageSendSucceeded) {
      console.log(`Unable to successfully send a message to all [${tabs.length}] relevant tabs. Try refreshing a ${LEETCODE_DOMAIN} tab. Retrying in ${DEFAULT_POLLING_RATE_IN_MINUTES} minutes.`);
    }
  }
}

function getColorFromSubmissionCount(count: number) {
  let maxMetThreshold: number = 0;
  for (const stringThreshold of Object.keys(COLOR_THRESHOLDS)) {
    const threshold = Number(stringThreshold);
    if (count >= threshold && threshold > maxMetThreshold) {
      // console.log(`Count: ${count}, threshold: ${threshold}`);
      maxMetThreshold = threshold;
    }
  }

  const resultColor: Colors = COLOR_THRESHOLDS[maxMetThreshold];

  // console.log(`Resulting Color: ${resultColor}`);

  return resultColor;
}

function setBadgeFromSubmissions(submissions: SubmissionArray) {
  // console.log(`Successfully got ${submissions.length} submissions from call.`)
  // console.log(submissions);

  const dailyAcceptedSubmissions = submissions
    .filter(submission => submission.status == "Accepted")
    .filter(submission => isWithinCurrentDay(submission.timestampInSeconds));

  // console.log(`Daily Accepted Submissions: ${JSON.stringify(dailyAcceptedSubmissions)}`);
  const latestSubmissions = [];
  const questionSet = new Set<string>();

  for (const submission of dailyAcceptedSubmissions) {
    if (!questionSet.has(submission.questionId)) {
      latestSubmissions.push(submission);
      questionSet.add(submission.questionId);
    }
  }
  // console.log(`Latest Submissions: ${JSON.stringify(latestSubmissions)}`);

  const relevantSubmissionCount = latestSubmissions.length;

  setBadgeText(relevantSubmissionCount.toString(),
    getColorFromSubmissionCount(relevantSubmissionCount));
}

async function initiateSubmissionsMessagePassing() {
  sendGetSubmissionsMessage();

  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.type === GET_SUBMISSIONS_RESPONSE_TYPE) {
      setBadgeFromSubmissions(message.submissions);
      sendResponse({
        wasReceived: true,
        isTypeSupported: true
      });
    } else {
      sendResponse({
        wasReceived: true,
        isTypeSupported: false
      });
    }
  });

  setInterval(sendGetSubmissionsMessage, DEFAULT_POLLING_RATE);
}

setBadgeText('...', Colors.Red);
initiateSubmissionsMessagePassing();

// chrome.runtime.onStartup.addListener(() => {
//   console.log("Extension is starting up.");
//   initiateSubmissionsMessagePassing();
// });

// Heartbeat
// setInterval(() => console.log(new Date().getTime()), 5000);
