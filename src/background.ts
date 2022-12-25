import { GET_SUBMISSIONS_REQUEST_TYPE } from './requests/types';

// 5 minutes
const DEFAULT_POLLING_RATE = 1000 * 60 * 5;
const LEETCODE_URL_MATCH = "*://leetcode.com/*";
const LEETCODE_DOMAIN = "leetcode.domain";

function setBadgeNumber(num: number): void {
  chrome.browserAction.setBadgeText({ text: num.toString() });
}

function isWithinCurrentDay(timestamp: number): boolean {
  const inputDate = new Date(timestamp);
  inputDate.setHours(inputDate.getHours() - 6);
  const currentDate = new Date();
  currentDate.setHours(currentDate.getHours() - 6);

  return inputDate.getDate() == currentDate.getDate();
}

function getSubmissionsAndSetBadge() {
  console.log("Inside getSubmissionsAndSetBadge");
  chrome.tabs.query({ active: true, url: LEETCODE_URL_MATCH }, function(tabs) {
    if (tabs.length <= 0) {
      console.log(`Unable to find any tabs that match url: ${ LEETCODE_URL_MATCH }`)
      return;
    }
    const currentTab = tabs[0];

    console.log(tabs);


    chrome.tabs.sendMessage(currentTab.id, { type: GET_SUBMISSIONS_REQUEST_TYPE }, function(response) {
      console.log(`Successfully got ${response.submissions.length} submissions from call.`)

      const dailyAcceptedSubmissions = response.submissions
        .filter(submission => submission.status != "Accepted")
        .filter(submission => isWithinCurrentDay(submission.timestamp));

      const latestSubmissions = [];
      const questionSet = new Set<string>();

      for (const submission of dailyAcceptedSubmissions) {
        if (!questionSet.has(submission.questionId)) {
          latestSubmissions.push(submission);
          questionSet.add(submission.questionId);
        }
      }

      setBadgeNumber(latestSubmissions.length);
    });
  });

  setTimeout(getSubmissionsAndSetBadge, 2500);
}

getSubmissionsAndSetBadge();
setInterval(() => console.log(new Date().getTime()), 2500);
