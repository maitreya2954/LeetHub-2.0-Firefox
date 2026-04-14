let action = false;

$('#authenticate').on('click', () => {
  if (action) {
    oAuth2.begin();
  }
});

/* Get URL for welcome page */
$('#welcome_URL').attr('href', BrowserUtil.instance.runtime.getURL('welcome.html'));
$('#hook_URL').attr('href', BrowserUtil.instance.runtime.getURL('welcome.html'));

$('#reset_stats').on('click', () => {
  $('#reset_confirmation').show();
  $('#reset_yes')
    .off('click')
    .on('click', () => {
      // Clear all stats and reset display
      BrowserUtil.instance.storage.local.set({ stats: null });
      updateStats(0, 0, 0, 0);
      $('#reset_confirmation').hide();
      console.log('Stats reset successfully');
    });
  $('#reset_no')
    .off('click')
    .on('click', () => {
      $('#reset_confirmation').hide();
    });
});

// Function to update stats and pie chart
function updateStats(total, easy, medium, hard) {
  $('#p_solved').text(total);
  $('#p_solved_easy').text(easy);
  $('#p_solved_medium').text(medium);
  $('#p_solved_hard').text(hard);

  if (window.myPieChart) {
    window.myPieChart.data.datasets[0].data = [easy, medium, hard];
    window.myPieChart.update();
  }
}

/**
 * Calculate combined stats from different platforms
 * Handles both old format (single stats) and new format (platform-separated)
 */
function getCombinedStats(stats) {
  if (!stats) {
    return { solved: 0, easy: 0, medium: 0, hard: 0 };
  }

  // New format with platform separation
  if (stats.combined) {
    return stats.combined;
  }

  // Old format - single stats object (backward compatibility)
  if (stats.solved !== undefined) {
    return {
      solved: stats.solved,
      easy: stats.easy || 0,
      medium: stats.medium || 0,
      hard: stats.hard || 0,
    };
  }

  return { solved: 0, easy: 0, medium: 0, hard: 0 };
}

function initializeChart() {
  if (window.myPieChart) {
    return window.myPieChart;
  }

  const canvas = document.getElementById('difficultyChart');
  if (!canvas) {
    console.error('Canvas element not found!');
    return null;
  }

  const ctx = canvas.getContext('2d');
  window.myPieChart = new Chart(ctx, {
    type: 'pie',
    data: {
      labels: ['Easy', 'Medium', 'Hard'],
      datasets: [
        {
          data: [0, 0, 0],
          backgroundColor: ['#4d79ff', '#f0ad4e', '#d9534f'],
        },
      ],
    },
    options: {
      plugins: {
        legend: {
          labels: {
            boxWidth: 10,
            boxHeight: 10,
            padding: 8,
            font: {
              size: 11,
            },
          },
        },
      },
    },
  });

  return window.myPieChart;
}

// Load user authentication
BrowserUtil.instance.storage.local.get('leethub_token', data => {
  const token = data.leethub_token;
  if (!token) {
    action = true;
    $('#auth_mode').show();
  } else {
    const AUTHENTICATION_URL = 'https://api.github.com/user';

    const xhr = new XMLHttpRequest();
    xhr.addEventListener('readystatechange', function () {
      if (xhr.readyState === 4) {
        if (xhr.status === 200) {
          BrowserUtil.instance.storage.local.get('mode_type', data2 => {
            if (data2 && data2.mode_type === 'commit') {
              $('#commit_mode').show();
              initializeChart();
              BrowserUtil.instance.storage.local.get(['stats', 'leethub_hook'], data3 => {
                const stats = data3?.stats || { solved: 0, easy: 0, medium: 0, hard: 0 };
                const combined = getCombinedStats(stats);
                updateStats(combined.solved, combined.easy, combined.medium, combined.hard);
                const leethubHook = data3?.leethub_hook;
                if (leethubHook) {
                  $('#repo_url').html(
                    `<a target="blank" style="color: cadetblue !important; font-size:0.8em;" href="https://github.com/${leethubHook}">${leethubHook}</a>`
                  );
                }
              });
            } else {
              $('#hook_mode').show();
            }
          });
        } else if (xhr.status === 401) {
          BrowserUtil.instance.storage.local.set({ leethub_token: null }, () => {
            console.log('BAD oAuth!!! Redirecting back to oAuth process');
            action = true;
            $('#auth_mode').show();
          });
        }
      }
    });
    xhr.open('GET', AUTHENTICATION_URL, true);
    xhr.setRequestHeader('Authorization', `token ${token}`);
    xhr.send();
  }
});
