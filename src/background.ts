import { GET_SUBMISSIONS_REQUEST_TYPE } from './requests/types';
import { GET_SUBMISSIONS_RESPONSE_TYPE, SubmissionArray } from './responses/types';

import { LEETCODE_TAB_PORT_NAME } from './common/constants';

// 5 minutes
const DEFAULT_POLLING_RATE = 1000 * 60 * 5;
const LEETCODE_URL_MATCH = "*://leetcode.com/*";
const LEETCODE_DOMAIN = "leetcode.domain";

function setBadgeNumber(num: number): void {
  const newBadgeText: string = num.toString();
  console.log(`Set badge text to [${newBadgeText}] at time [${new Date().toLocaleString()}]`);
  chrome.action.setBadgeBackgroundColor({ color: "#FE0000" });
  chrome.action.setBadgeText({ text: num.toString() });
}

function isWithinCurrentDay(timestampInSeconds: number): boolean {
  const inputDate = new Date(timestampInSeconds * 1000);
  inputDate.setHours(inputDate.getHours() - 6);
  const currentDate = new Date();
  currentDate.setHours(currentDate.getHours() - 6);

  return inputDate.getDate() == currentDate.getDate();
}

async function sendGetSubmissionsMessage() {
  const tabs = await chrome.tabs.query({ active: true, status: "complete", url: LEETCODE_URL_MATCH });

  if (tabs.length <= 0) {
    console.log(`Unable to find any tabs that match url: ${ LEETCODE_URL_MATCH }`)
    return;
  }

  const currentTabId = tabs[0].id;

  chrome.tabs.sendMessage(currentTabId, { type: GET_SUBMISSIONS_REQUEST_TYPE }, function(response) {
    console.log(response);
  });
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

  setBadgeNumber(latestSubmissions.length);
}

async function initiateSubmissionsMessagePassing() {
  console.log("Inside getSubmissionsAndSetBadge");

  sendGetSubmissionsMessage();

  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.type === GET_SUBMISSIONS_RESPONSE_TYPE) {
      setBadgeFromSubmissions(message.submissions);
      return true;
    } else {
      return false;
    }
  });

  setInterval(sendGetSubmissionsMessage, DEFAULT_POLLING_RATE);
}

initiateSubmissionsMessagePassing();
// Heartbeat
// setInterval(() => console.log(new Date().getTime()), 5000);
