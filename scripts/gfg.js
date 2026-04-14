import { uploadGFGProblem } from './leetcode/upload';
import { languages, LeetHubError } from './leetcode/util';

/**
 * GeeksForGeeks Language Extension Mapping
 * Maps GFG language names to file extensions
 */
const gfgLanguages = {
  Python3: '.py',
  Python: '.py',
  'C++': '.cpp',
  Java: '.java',
  JavaScript: '.js',
  'C#': '.cs',
  Kotlin: '.kt',
  Go: '.go',
  Rust: '.rs',
};

let START_MONITOR = true;

const toKebabCase = string => {
  return string
    .replace(/[^a-zA-Z0-9\. ]/g, '') // remove special chars
    .replace(/([a-z])([A-Z])/g, '$1-$2') // get all lowercase letters that are near to uppercase ones
    .replace(/[\s_]+/g, '-') // replace all spaces and low dash
    .toLowerCase(); // convert to lower case
};

function findGfgLanguage() {
  try {
    const ele = document.getElementsByClassName('divider text')[0]?.innerText;
    if (!ele) return null;

    const lang = ele.split('(')[0].trim();
    if (lang.length > 0 && gfgLanguages[lang]) {
      return gfgLanguages[lang];
    }
  } catch (error) {
    console.error('Error finding GFG language:', error);
  }
  return null;
}

function findTitle() {
  try {
    const ele = document.querySelector('[class^="problems_header_content__title"] > h3')?.innerText;
    return ele || '';
  } catch (error) {
    console.error('Error finding GFG title:', error);
    return '';
  }
}

function findDifficulty() {
  try {
    const ele = document.querySelectorAll('[class^="problems_header_description"]')?.[0]?.children?.[0]
      ?.innerText;

    if (ele) {
      if (ele.trim() === 'Basic' || ele.trim() === 'School') {
        return 'Easy';
      }
      return ele.trim();
    }
  } catch (error) {
    console.error('Error finding GFG difficulty:', error);
  }
  return '';
}

function getProblemStatement() {
  try {
    const ele = document.querySelector('[class^="problems_problem_content"]');
    return ele ? ele.outerHTML : '';
  } catch (error) {
    console.error('Error getting GFG problem statement:', error);
    return '';
  }
}

function getCode() {
  try {
    const scriptContent = `
    var editor = ace.edit("ace-editor");
    var editorContent = editor.getValue();
    var para = document.createElement("pre");
    para.innerText+=editorContent;
    para.setAttribute("id","codeDataLeetHub")
    document.body.appendChild(para);
    `;

    const script = document.createElement('script');
    script.id = 'tmpScript';
    script.appendChild(document.createTextNode(scriptContent));
    (document.body || document.head || document.documentElement).appendChild(script);

    const text = document.getElementById('codeDataLeetHub')?.innerText || '';

    // Clean up
    const nodeDeletionScript = `
    document.body.removeChild(document.getElementById('codeDataLeetHub'));
    document.body.removeChild(document.getElementById('tmpScript'));
    `;
    const cleanupScript = document.createElement('script');
    cleanupScript.appendChild(document.createTextNode(nodeDeletionScript));
    (document.body || document.head || document.documentElement).appendChild(cleanupScript);

    return text;
  } catch (error) {
    console.error('Error getting GFG code:', error);
    return '';
  }
}

/**
 * Main GFG submission handler
 * Monitors for successful submissions and uploads to GitHub
 */
const gfgLoader = setInterval(() => {
  if (!window.location.href.includes('practice.geeksforgeeks.org/problems')) {
    return;
  }

  try {
    const submitBtn = document
      .evaluate(".//button[text()='Submit']", document.body, null, XPathResult.ANY_TYPE, null)
      .iterateNext();

    if (!submitBtn) {
      return;
    }

    submitBtn.addEventListener('click', function handleGFGSubmit() {
      START_MONITOR = true;
      const submission = setInterval(() => {
        try {
          const output = document.querySelectorAll('[class^="problems_content"]')?.[0]?.innerText || '';

          if (output.includes('Problem Solved Successfully') && START_MONITOR) {
            // Clear monitoring
            START_MONITOR = false;
            clearInterval(gfgLoader);
            clearInterval(submission);

            // Extract problem data
            const title = findTitle().trim();
            const difficulty = findDifficulty();
            const problemStatement = getProblemStatement();
            const code = getCode();
            const language = findGfgLanguage();

            // Validate data
            if (!title || !code || !language) {
              console.error(
                new LeetHubError('IncompletGFGData: Missing title, code, or language')
              );
              return;
            }

            // Format problem statement
            const formattedProblemStatement = `# ${title}\n## ${difficulty}\n${problemStatement}`;

            // Upload to GitHub
            uploadGFGProblem({
              title,
              code,
              problemStatement: formattedProblemStatement,
              difficulty,
              language,
            })
              .then(() => {
                console.log(`Successfully uploaded ${title} to GitHub`);
              })
              .catch(error => {
                console.error(`Error uploading ${title} to GitHub:`, error);
              });
          } else if (output.includes('Compilation Error')) {
            clearInterval(submission);
          } else if (
            !START_MONITOR &&
            (output.includes('Compilation Error') || output.includes('Correct Answer'))
          ) {
            clearInterval(submission);
          }
        } catch (error) {
          console.error('Error in GFG submission polling:', error);
          clearInterval(submission);
        }
      }, 1000); // Poll every 1 second
    });
  } catch (error) {
    console.warn('GFG content script initialization note:', error.message);
  }
}, 1000); // Check for page load every 1 second
