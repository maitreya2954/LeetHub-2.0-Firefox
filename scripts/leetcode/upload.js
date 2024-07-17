import { appendProblemToReadme } from "./readmeTopics";
import { LeetHubError } from "./util";

const FILENAMES = {
  readme: 'README.md',
  notes: 'NOTES.md',
}

const defaultRepoReadme = 'A collection of LeetCode questions to ace the coding interviews! - Created using [LeetHub 2.0 for Firefox](https://github.com/maitreya2954/LeetHub-2.0-Firefox)'

const { TOKEN, HOOK, HEADERS, COMMITS_URL, REPO_TREE_URL, REF_URL } = await BrowserUtil.instance.storage.local.get([
  'leethub_token',
  'leethub_hook'
]).then((token, hook) => {
  var commits_url = `https://api.github.com/repos/${hook}/git/commits`;
  var repo_tree_url = `https://api.github.com/repos/${hook}/git/trees`;
  var ref_url = `https://api.github.com/repos/${hook}/git/refs/heads/main`
  var headers = {
    Authorization: `token ${token}`,
    Accept: 'application/vnd.github.v3+json',
  }
  return {
    token,
    hook,
    headers,
    commits_url,
    repo_tree_url,
    ref_url
  }
});

const getLocalStats = () => {
  return BrowserUtil.instance.local.get('stats').then(({ stats }) => { return stats })
}

const getPath = (problem, filename) => {
  return filename ? `${problem}/${filename}` : problem;
};


async function getGitHubResponse(URL, options) {
  return fetch(URL, options).then(res => {
    if (!res.ok) {
      throw new Error(res.status);
    }
    return res;
  }).then((res) => {return res.json()});
}

/* Returns GitHub data for the file specified by `${directory}/${filename}` path */
async function getGitHubFile(directory, filename) {
  const path = getPath(directory, filename);
  const URL = `https://api.github.com/repos/${HOOK}/contents/${path}`;
  let options = {
    method: 'GET',
    headers: HEADERS
  }

  return getGitHubResponse(URL, options);
}

/* Create tree and push all the files in single commit */
async function createTreeAndCommit(filesToCommit, commitMsg) {
  const filemode = '100644'
  const filetype = 'blob'

  // Get the sha of the last commit on main branch
  const { object: { sha: currentCommitSha } }  = await getGitHubResponse(REF_URL, {
    method: 'GET',
    headers: HEADERS
  });

  // Get the SHA of the root tree of the last commit
  const currentCommitUrl = `${COMMITS_URL}/${currentCommitSha}`;
  const { tree: { sha: treeSha } } = await getGitHubResponse(currentCommitUrl, {
    method: 'GET',
    headers: HEADERS
  });

  // Create a tree to edit the content of the repository
  const { sha: newTreeSha } = await getGitHubResponse(REPO_TREE_URL, {
    method: 'POST',
    headers: HEADERS,
    body: {
      base_tree: treeSha,
      tree: filesToCommit
        .map(({ content, path }) => (
          { path, content, mode: filemode, type: filetype } // Works for text files, utf-8 assumed
        )),
    },
  });

  // Create a commit that uses the tree created above
  const { sha: newCommitSha } = await getGitHubResponse(COMMITS_URL, {
    method: 'POST',
    headers: HEADERS,
    body: {
      message: commitMsg,
      tree: newTreeSha,
      parents: [currentCommitSha],
    },
  });

  // Make BRANCH_NAME point to the created commit
  await getGitHubResponse(REF_URL, {
    method: 'POST',
    headers: HEADERS,
    body: {
      sha: newCommitSha
    }
  });
}

async function uploadOnAcceptedSubmission(leetcode) {
  await leetcode.init();

  let localStats = await getLocalStats();

  const problemStats = leetcode.parseStats();
  if (!problemStats) {
    throw new LeetHubError('SubmissionStatsNotFound');
  }

  const problemStatement = leetCode.parseQuestion();
  if (!problemStatement) {
    throw new LeetHubError('ProblemStatementNotFound');
  }

  const problemName = leetCode.getProblemNameSlug();
  const language = leetCode.getLanguageExtension();
  if (!language) {
    throw new LeetHubError('LanguageNotFound');
  }
  const filename = problemName + language;

  const filesToCommit = []

  // Add problem README file
  if (localStats?.shas?.[problemName]?.[FILENAMES.readme] === undefined) {
    filesToCommit.push({
      path: getPath(problemName, FILENAMES.readme),
      content: btoa(unescape(encodeURIComponent(problemStatement)))
    })
  }

  // Add notes if present
  let notes = leetcode.getNotesIfAny();
  if (notes != undefined && notes.length > 0) {
    filesToCommit.push({
      path: getPath(problemName, FILENAMES.notes),
      content: btoa(unescape(encodeURIComponent(notes)))
    })
  }

  // Update repo README file, grouping problem into its relevant topics
  if (leetcode.submissionData?.question?.topicTags === undefined) {
    console.log(new LeetHubError('TopicTagsNotFound'));
  } else {
    let readme;
    try {
      const { content, sha } = await getGitHubFile(TOKEN, HOOK, readmeFilename).then(resp => resp.json());
      localStats.shas[FILENAMES.readme] = { '': sha };
      readme = decodeURIComponent(escape(atob(content)));
    } catch (error) {
      if (error.message === '404') { // README not found
        readme = defaultRepoReadme
      }
    }

    for (let topic of topicTags) {
      readme = appendProblemToReadme(topic.name, readme, HOOK, problemName);
    }

    readme = sortTopicsInReadme(readme);
    filesToCommit.push({
      path: getPath(FILENAMES.readme, undefined),
      content: btoa(unescape(encodeURIComponent(readme)))
    })
  }



}

export { uploadOnAcceptedSubmission }