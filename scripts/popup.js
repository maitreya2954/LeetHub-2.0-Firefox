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
      BrowserUtil.instance.storage.local.set({ stats: null });
      updateStats(0, 0, 0, 0);
      $('#reset_confirmation').hide();
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
              BrowserUtil.instance.storage.local.get(['stats', 'leethub_hook'], data3 => {
                const stats = data3?.stats || { solved: 0, easy: 0, medium: 0, hard: 0 };
                updateStats(stats.solved, stats.easy, stats.medium, stats.hard);
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

// Add Pie Chart using Chart.js
$(document).ready(() => {
  const ctx = document.getElementById('difficultyChart').getContext('2d');

  if (!ctx) {
    console.error('Canvas element not found!');
    return;
  }

  window.myPieChart = new Chart(ctx, {
    type: 'pie',
    data: {
      labels: ['Easy', 'Medium', 'Hard'],
      datasets: [
        {
          data: [0, 0, 0], // Initial values
          backgroundColor: ['#4d79ff', '#f0ad4e', '#d9534f'],
        },
      ],
    },
  });

  // Ensure stats are loaded and reflected in the pie chart
  BrowserUtil.instance.storage.local.get('stats', data => {
    const stats = data?.stats || { easy: 0, medium: 0, hard: 0 };
    updateStats(stats.easy + stats.medium + stats.hard, stats.easy, stats.medium, stats.hard);
  });
});
