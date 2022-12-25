import { GET_SUBMISSIONS_REQUEST_TYPE } from './requests/types';
import { GET_SUBMISSIONS_RESPONSE_TYPE } from './responses/types';
import { Submission, SubmissionArray } from './responses/types';
import { LEETCODE_TAB_PORT_NAME } from './common/constants';

const DEFAULT_OFFSET = 0;
const DEFAULT_LIMIT = 50;
const REQUEST_URL = `/api/submissions?offset=${ DEFAULT_OFFSET }&limit=${ DEFAULT_LIMIT }&lastkey=`;

// console.log("Content Script loaded: setBadge");

async function sendGetSubmissionsResponse() {
  const response = await fetch(REQUEST_URL);

  const responseSubmissions = await response.json();
  // console.log(responseSubmissions);

  const submissions: SubmissionArray = responseSubmissions['submissions_dump'].map(responseSubmission => {
    return {
      id: responseSubmission.id,
      language: responseSubmission.lang,
      timestampInSeconds: responseSubmission.timestamp,
      status: responseSubmission.status_display,
      questionId: responseSubmission.title_slug
    }
  });

  // console.log(submissions)

  chrome.runtime.sendMessage({type: GET_SUBMISSIONS_RESPONSE_TYPE, submissions}, (response) => {
    // console.log(`Sent message of type [${GET_SUBMISSIONS_RESPONSE_TYPE}] with ${submissions}`);
    // console.log(response.farewell);
  });
}

chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
  // console.log("Received request in setBadge");
  if (request.type === GET_SUBMISSIONS_REQUEST_TYPE) {
    sendGetSubmissionsResponse();
    return true;
  } else {
    return false;
  }
});
