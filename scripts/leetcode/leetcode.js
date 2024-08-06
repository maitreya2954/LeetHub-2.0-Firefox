import { LeetCodeV1, LeetCodeV2 } from './versions';
import setupManualSubmitBtn from './submitBtn';
import {
  debounce,
  isEmpty,
  LeetHubError,
  FILENAMES
} from './util';
import { uploadOnAcceptedSubmission, uploadGitHubFile, decode_base64, encode_base64 } from './upload';

/* Discussion Link - When a user makes a new post, the link is prepended to the README for that problem.*/
document.addEventListener('click', event => {
  const element = event.target;
  const oldPath = window.location.pathname;

  /* Act on Post button click */
  /* Complex since "New" button shares many of the same properties as "Post button */
  if (
    element.classList.contains('icon__3Su4') ||
    element.parentElement.classList.contains('icon__3Su4') ||
    element.parentElement.classList.contains('btn-content-container__214G') ||
    element.parentElement.classList.contains('header-right__2UzF')
  ) {
    setTimeout(function () {
      /* Only post if post button was clicked and url changed */
      if (
        oldPath !== window.location.pathname &&
        oldPath === window.location.pathname.substring(0, oldPath.length) &&
        !Number.isNaN(window.location.pathname.charAt(oldPath.length))
      ) {
        const date = new Date();
        const currentDate = `${date.getDate()}/${date.getMonth()}/${date.getFullYear()} at ${date.getHours()}:${date.getMinutes()}`;
        const addition = `[Discussion Post (created on ${currentDate})](${window.location})  \n`;
        const problemName = window.location.pathname.split('/')[2]; // must be true.
        
        BrowserUtil.instance.storage.local
        .get(['leethub_token', 'leethub_hook'])
        .then(({ leethub_token, leethub_hook }) => {
          if (!leethub_token) {
            throw new LeetHubError('LeethubTokenUndefined');
          }
          if (!leethub_hook) {
            throw new LeetHubError('NoRepoDefined');
          }
          getGitHubFile(leethub_token, leethub_hook, FILENAMES.readme)
          .then((data) => {
            let existingContent = decode_base64(data);
            let uploadContent = encode_base64(addition + existingContent);
            // Append discussion post link to current readme file and upload to github
            uploadGitHubFile(leethub_token, leethub_hook, 'Prepend discussion post - LeetHub', uploadContent, problemName, FILENAMES.readme);
          })
        });
      }
    }, 1000);
  }
});

function loader(leetCode) {
  let iterations = 0;
  const intervalId = setInterval(async () => {
    try {
      const isSuccessfulSubmission = leetCode.getSuccessStateAndUpdate();
      if (!isSuccessfulSubmission) {
        iterations++;
        if (iterations > 9) {
          // poll for max 10 attempts (10 seconds)
          throw new LeetHubError('Could not find successful submission after 10 seconds.');
        }
        return;
      }
      leetCode.startSpinner();

      // If successful, stop polling
      clearInterval(intervalId);
      await uploadOnAcceptedSubmission(leetCode);
      leetCode.markUploaded();
    } catch (err) {
      leetCode.markUploadFailed();
      clearInterval(intervalId);
      console.error(err);
    }
  }, 1000);
}

// Submit by Keyboard Shortcuts only support on LeetCode v2
function wasSubmittedByKeyboard(event) {
  const isEnterKey = event.key === 'Enter';
  const isMacOS = window.navigator.userAgent.includes('Mac');

  // Adapt to MacOS operating system
  return isEnterKey && ((isMacOS && event.metaKey) || (!isMacOS && event.ctrlKey));
}

// Get SubmissionID by listening for URL changes to `/submissions/(d+)` format
async function listenForSubmissionId() {
  const { submissionId } = await BrowserUtil.instance.runtime.sendMessage({
    type: 'LEETCODE_SUBMISSION',
  });
  if (submissionId == null) {
    console.log(new LeetHubError('SubmissionIdNotFound'));
    return;
  }
  return submissionId;
}

async function v2SubmissionHandler(event, leetCode) {
  if (event.type !== 'click' && !wasSubmittedByKeyboard(event)) {
    return;
  }

  const authenticated =
    !isEmpty(await BrowserUtil.instance.storage.local.get(['leethub_token'])) &&
    !isEmpty(await BrowserUtil.instance.storage.local.get(['leethub_hook']));
  if (!authenticated) {
    throw new LeetHubError('UserNotAuthenticated');
  }

  // is click or is ctrl enter
  const submissionId = await listenForSubmissionId();
  leetCode.submissionId = submissionId;
  loader(leetCode);
  return true;
}

// Use MutationObserver to determine when the submit button elements are loaded
const submitBtnObserver = new MutationObserver(function (mutations, observer) {
  const v1SubmitBtn = document.querySelector('[data-cy="submit-code-btn"]');
  const v2SubmitBtn = document.querySelector('[data-e2e-locator="console-submit-button"]');
  const textareaList = document.getElementsByTagName('textarea');
  const textarea =
    textareaList.length === 4
      ? textareaList[2]
      : textareaList.length === 2
      ? textareaList[0]
      : textareaList[1];

  if (v1SubmitBtn) {
    observer.disconnect();

    const leetCode = new LeetCodeV1();
    v1SubmitBtn.addEventListener('click', () => loader(leetCode));
    return;
  }

  if (v2SubmitBtn && textarea) {
    observer.disconnect();

    const leetCode = new LeetCodeV2();
    textarea.addEventListener('keydown', e => v2SubmissionHandler(e, leetCode));
    v2SubmitBtn.addEventListener('click', e => v2SubmissionHandler(e, leetCode));
  }
});

submitBtnObserver.observe(document.body, {
  childList: true,
  subtree: true,
});

/* Sync to local storage */
BrowserUtil.instance.storage.local.get('isSync', data => {
  const keys = [
    'leethub_token',
    'leethub_username',
    'pipe_leethub',
    'stats',
    'leethub_hook',
    'mode_type',
  ];
  if (!data || !data.isSync) {
    keys.forEach(key => {
      BrowserUtil.instance.storage.sync.get(key, data => {
        BrowserUtil.instance.storage.local.set({ [key]: data[key] });
      });
    });
    BrowserUtil.instance.storage.local.set({ isSync: true }, () => {
      console.log('LeetHub Synced to local values');
    });
  } else {
    console.log('LeetHub Local storage already synced!');
  }
});

setupManualSubmitBtn(
  debounce(
    () => {
      // Manual submission event doesn't need to wait for submission url. It already has it.
      const leetCode = new LeetCodeV2();
      const submissionId = window.location.href.match(/leetcode\.com\/.*\/submissions\/(\d+)/)[1];
      leetCode.submissionId = submissionId;
      loader(leetCode);
      return;
    },
    5000,
    true
  )
);

class LeetHubNetworkError extends LeetHubError {
  constructor(response) {
    super(response.statusText);
    this.status = response.status;
  }
}
