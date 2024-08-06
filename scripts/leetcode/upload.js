import { appendProblemToReadme, sortTopicsInReadme } from './readmeTopics';
import { DIFFICULTY, LeetHubError, getDifficulty, FILENAMES } from './util';

const defaultRepoReadme =
  'A collection of LeetCode questions to ace the coding interviews! - Created using [LeetHub 2.0 for Firefox](https://github.com/maitreya2954/LeetHub-2.0-Firefox)';

const getPath = (problem, filename) => {
  return filename ? `${problem}/${filename}` : problem;
};

// TO DO: create encode and decode functions

function decode(content) {
  return decodeURIComponent(escape(content));
}

function encode(content) {
  return unescape(encodeURIComponent(content));
}

function decode_base64(content) {
  return decodeURIComponent(escape(atob(content)));
}

function encode_base64(content) {
  return btoa(unescape(encodeURIComponent(content)));
}

async function getGitHubResponse(URL, options) {
  return fetch(URL, options)
    .then(res => {
      if (!res.ok) {
        // using window.Error is a workaround to avoid promise rejection being wrapped by
        // generic error object, which is not useful for us.
        throw new window.Error(res.status);
      }
      return res;
    })
    .then(res => {
      return res.json();
    })
    .catch(err => {
      throw err;
    });
}

/* Returns GitHub data for the file specified by `${directory}/${filename}` path */
async function getGitHubFile(token, hook, directory, filename) {
  const path = getPath(directory, filename);
  const URL = `https://api.github.com/repos/${hook}/contents/${path}`;
  let options = {
    method: 'GET',
    headers: {
      Authorization: `token ${token}`,
      Accept: 'application/vnd.github.v3+json',
    },
  };

  return getGitHubResponse(URL, options);
}

/* Upload a file to github at the given path and returns sha of uploaded file */
async function uploadGitHubFile(token, hook, message, content, directory, filename) {
  const path = getPath(directory, filename);
  let data = JSON.stringify({
    message,
    content,
  });

  const URL = `https://api.github.com/repos/${hook}/contents/${path}`;
  const {
    content: { sha: newSha },
  } = await getGitHubResponse(URL, {
    method: 'PUT',
    headers: {
      Authorization: `token ${token}`,
      Accept: 'application/vnd.github.v3+json',
    },
    body: data,
  });

  return newSha;
}

/* Create tree and push all the files in single commit (utf-8 encoded) */
async function createTreeAndCommit(token, hook, filesToCommit, commitMsg) {
  var COMMITS_URL = `https://api.github.com/repos/${hook}/git/commits`;
  var REPO_TREE_URL = `https://api.github.com/repos/${hook}/git/trees`;
  var REF_URL = `https://api.github.com/repos/${hook}/git/refs/heads/main`;
  var HEADERS = {
    Authorization: `token ${token}`,
    Accept: 'application/vnd.github.v3+json',
  };
  const filemode = '100644';
  const filetype = 'blob';

  // Get the sha of the last commit on main branch
  const {
    object: { sha: currentCommitSha },
  } = await getGitHubResponse(REF_URL, {
    method: 'GET',
    headers: HEADERS,
  });

  // Get the SHA of the root tree of the last commit
  const currentCommitUrl = `${COMMITS_URL}/${currentCommitSha}`;
  const {
    tree: { sha: treeSha },
  } = await getGitHubResponse(currentCommitUrl, {
    method: 'GET',
    headers: HEADERS,
  });

  // Create a tree to edit the content of the repository
  const { sha: newTreeSha } = await getGitHubResponse(REPO_TREE_URL, {
    method: 'POST',
    headers: HEADERS,
    body: JSON.stringify({
      base_tree: treeSha,
      tree: filesToCommit.map(({ content, path }) => ({
        path,
        content,
        mode: filemode,
        type: filetype,
      })), // Works for text files, utf-8 assumed
    }),
  });

  // Create a commit that uses the tree created above
  const { sha: newCommitSha } = await getGitHubResponse(COMMITS_URL, {
    method: 'POST',
    headers: HEADERS,
    body: JSON.stringify({
      message: commitMsg,
      tree: newTreeSha,
      parents: [currentCommitSha],
    }),
  });

  // Make BRANCH_NAME point to the created commit
  await getGitHubResponse(REF_URL, {
    method: 'POST',
    headers: HEADERS,
    body: JSON.stringify({
      sha: newCommitSha,
    }),
  });

  return newCommitSha;
}

async function uploadOnAcceptedSubmission(leetcode) {
  let token, hook, localStats;
  await BrowserUtil.instance.storage.local
    .get(['leethub_token', 'mode_type', 'leethub_hook', 'stats'])
    .then(({ leethub_token, leethub_hook, mode_type, stats }) => {
      if (!leethub_token) {
        throw new LeetHubError('LeethubTokenUndefined');
      }
      token = leethub_token;
      if (mode_type !== 'commit') {
        throw new LeetHubError('LeetHubNotAuthorizedByGit');
      }
      if (!leethub_hook) {
        throw new LeetHubError('NoRepoDefined');
      }
      hook = leethub_hook;
      localStats = stats;
    });
  await leetcode.init();

  const problemStats = leetcode.parseStats();
  if (!problemStats) {
    throw new LeetHubError('SubmissionStatsNotFound');
  }

  const problemStatement = leetcode.parseQuestion();
  if (!problemStatement) {
    throw new LeetHubError('ProblemStatementNotFound');
  }

  const problemName = leetcode.getProblemNameSlug();
  const language = leetcode.getLanguageExtension();
  if (!language) {
    throw new LeetHubError('LanguageNotFound');
  }
  const filename = problemName + language;

  const filesToCommit = [];

  // Add problem README file
  if (localStats?.shas?.[problemName]?.[FILENAMES.readme] === undefined) {
    filesToCommit.push({
      path: getPath(problemName, FILENAMES.readme),
      content: encode(problemStatement),
    });
  }

  // Add notes if present
  let notes = leetcode.getNotesIfAny();
  if (notes != undefined && notes.length > 0) {
    filesToCommit.push({
      path: getPath(problemName, FILENAMES.notes),
      content: encode(notes),
    });
  }

  // Add code
  let code = leetcode.findCode(problemStats);
  filesToCommit.push({
    path: getPath(problemName, filename),
    content: encode(code),
  });

  // Update repo README file, grouping problem into its relevant topics
  if (leetcode.submissionData?.question?.topicTags === undefined) {
    console.log(new LeetHubError('TopicTagsNotFound'));
  } else {
    let readme;
    try {
      const { content, sha } = await getGitHubFile(token, hook, FILENAMES.readme);
      localStats.shas[FILENAMES.readme] = { '': sha };
      readme = decode(content);
    } catch (error) {
      if (error.message === '404') {
        // README not found
        readme = defaultRepoReadme;
      }
    }

    for (let topic of leetcode.submissionData?.question?.topicTags) {
      readme = appendProblemToReadme(topic.name, readme, hook, problemName);
    }

    readme = sortTopicsInReadme(readme);
    filesToCommit.push({
      path: getPath(FILENAMES.readme, undefined),
      content: encode(readme),
    });
  }

  // Create a deepcopy of stats and increment the stats for a new problem
  // If the github upload is successfull, this copy of stats will be updated in the local storage
  let updateStats = localStats?.shas?.[problemName] === undefined;
  let tempStats = JSON.parse(JSON.stringify(localStats)); // Deep copy
  if (updateStats) {
    const diff = getDifficulty(leetcode.difficulty);
    tempStats.solved += 1;
    tempStats.easy += diff === DIFFICULTY.EASY ? 1 : 0;
    tempStats.medium += diff === DIFFICULTY.MEDIUM ? 1 : 0;
    tempStats.hard += diff === DIFFICULTY.HARD ? 1 : 0;
    tempStats.shas[problemName] = {
      sha: '',
      difficulty: diff.toLowerCase(),
    };
    filesToCommit.push({
      path: getPath(FILENAMES.stats),
      content: encode(JSON.stringify({ leetcode: tempStats })),
    });
  }

  let commitMsg = problemName.toUpperCase() + ' Stats: ' + problemStats;
  let commitSha = await createTreeAndCommit(token, hook, filesToCommit, commitMsg);
  tempStats.shas[problemName].sha = commitSha;
  await BrowserUtil.instance.storage.local.set({ stats: tempStats }).then(() => {
    console.log(`Successfully committed ${problemName} to github`);
  });
}

export { uploadOnAcceptedSubmission, uploadGitHubFile, decode_base64, encode_base64 };
