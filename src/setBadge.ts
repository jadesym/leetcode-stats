import { GET_SUBMISSIONS_REQUEST_TYPE } from './requests/types';
import { Submission, SubmissionArray } from './responses/types';

const DEFAULT_OFFSET = 0;
const DEFAULT_LIMIT = 50;
const REQUEST_URL = `/api/submissions?offset=${ DEFAULT_OFFSET }&limit=${ DEFAULT_LIMIT }&lastkey=`;

console.log("Content Script loaded: setBadge");

chrome.runtime.onMessage.addListener(async function(request, sender, sendResponse) {
  console.log("Received request in setBadge");
  if (request.type === GET_SUBMISSIONS_REQUEST_TYPE) {
    const response = await fetch(REQUEST_URL);

    const responseSubmissions = await response.json();
    console.log(responseSubmissions);

    const submissions: SubmissionArray = responseSubmissions['submissions_dump'].map(responseSubmission => {
      return {
        id: responseSubmission.id,
        language: responseSubmission.lang,
        timestamp: responseSubmission.timestamp,
        status: responseSubmission.status_display,
        questionId: responseSubmission.title_slug
      }
    })
    sendResponse({
      submissions
    });
  }
});
