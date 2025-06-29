document.addEventListener('DOMContentLoaded', function () {
  console.log("DOM fully loaded, initializing Football Assistant...");

  // DOM Elements
  const elements = {
    teamInput: document.getElementById("teamSearch"),
    searchBtn: document.getElementById("searchBtn"),
    clearBtn: document.getElementById("clearBtn"),
    searchResults: document.getElementById("searchResults"),
    output: document.getElementById("output"),
    suggestionsBox: document.getElementById("suggestions-box"),
    videoPopup: document.getElementById("video-popup"),
    videoPopupContent: document.getElementById("video-popup-content"),
    videoClose: document.getElementById("video-close"),
    liveMatchesBtn: document.getElementById("liveMatchesBtn"),
    videoHighlightsBtn: document.getElementById("videoHighlightsBtn"),
    fifaRankingBtn: document.getElementById("fifaRankingBtn"),
    aiChatbotBtn: document.getElementById("aiChatbotBtn"),
    liveMatchesContent: document.getElementById("liveMatchesContent"),
    videoHighlightsContent: document.getElementById("videoHighlightsContent"),
    fifaRankingContent: document.getElementById("fifaRankingContent"),
    aiChatbotContent: document.getElementById("aiChatbotContent"),
    widgetColumn: document.getElementById("widgetColumn"),
    loader: document.getElementById("loader"),
    shareBtn: document.getElementById("shareBtn"),
    socialShareButtons: document.getElementById("socialShareButtons"),
    whatsappShare: document.getElementById("whatsapp-share"),
    facebookShare: document.getElementById("facebook-share"),
    twitterShare: document.getElementById("twitter-share"),
    linkedinShare: document.getElementById("linkedin-share"),
    chatbotMessages: document.getElementById("chatbotMessages"),
    chatbotInput: document.getElementById("chatbotInput"),
    chatbotSendBtn: document.getElementById("chatbotSendBtn")
  };

  // Verify DOM elements
  const missingElements = Object.entries(elements).filter(([key, value]) => !value).map(([key]) => key);
  if (missingElements.length) {
    console.error("Missing DOM elements:", missingElements);
    elements.searchResults.innerHTML = '<span style="color: red;">Error: Missing HTML elements. Check console for details.</span>';
    return;
  }
  console.log("All DOM elements found.");

  // API Configuration
  const sportsDbApiHost = 'www.thesportsdb.com';
  const sportsDbApiKey = '3';

  // League mappings
  const leagueMap = {
    'Premier League': { id: 4328, name: 'Premier League', seasonFormat: 'autumn/spring' },
    'La Liga': { id: 4335, name: 'La Liga', seasonFormat: 'autumn/spring' },
    'Serie A': { id: 4332, name: 'Serie A', seasonFormat: 'autumn/spring' },
    'Bundesliga': { id: 4331, name: 'Bundesliga', seasonFormat: 'autumn/spring' },
    'Ligue 1': { id: 4334, name: 'Ligue 1', seasonFormat: 'autumn/spring' },
    'Eredivisie': { id: 4337, name: 'Eredivisie', seasonFormat: 'autumn/spring' },
    'Primeira Liga': { id: 4344, name: 'Primeira Liga', seasonFormat: 'autumn/spring' },
    'Super League': { id: 4346, name: 'Super League', seasonFormat: 'autumn/spring' },
    'Allsvenskan': { id: 4350, name: 'Allsvenskan', seasonFormat: 'calendar' },
    'Brazileiro': { id: 4351, name: 'Brazileiro', seasonFormat: 'calendar' },
    'AFC Champions League': { id: 4378, name: 'AFC Champions League', seasonFormat: 'autumn/spring' }
  };

  // Available seasons
  const seasons = [
    { display: '2024/2025', value: '2024/2025', format: 'autumn/spring' },
    { display: '2023/2024', value: '2023/2024', format: 'autumn/spring' },
    { display: '2022/2023', value: '2022/2023', format: 'autumn/spring' },
    { display: '2021/2022', value: '2021/2022', format: 'autumn/spring' },
    { display: '2020/2021', value: '2020/2021', format: 'autumn/spring' },
    { display: '2024', value: '2024', format: 'calendar' },
    { display: '2023', value: '2023', format: 'calendar' },
    { display: '2022', value: '2022', format: 'calendar' },
    { display: '2021', value: '2021', format: 'calendar' },
    { display: '2020', value: '2020', format: 'calendar' }
  ];

  // Chart registry
  const chartRegistry = new Map();

  // Team list for autocomplete
  let teamList = [];

  // Chatbot conversation history
  let chatbotConversation = [
    { role: 'system', content: 'You are a football assistant chatbot. Provide accurate and concise answers about football teams, players, matches, and predictions. Focus on football-related topics and keep responses engaging and informative.' }
  ];

  // Show loader
  function showLoader() {
    console.log("Showing loader");
    elements.loader.style.display = "flex";
    elements.loader.classList.add('aesthetic-loader');
  }

  // Hide loader
  function hideLoader() {
    console.log("Hiding loader");
    elements.loader.style.display = "none";
    elements.loader.classList.remove('aesthetic-loader');
  }

  // Destroy all charts
  function destroyCharts() {
    console.log("Destroying all charts...");
    chartRegistry.forEach((chart, id) => {
      if (chart) {
        chart.destroy();
        console.log(`Destroyed chart: ${id}`);
      }
    });
    chartRegistry.clear();
  }

  // Toggle widget content
  function toggleWidgetContent(contentId) {
    console.log(`Toggling widget content: ${contentId}`);
    const contents = [elements.liveMatchesContent, elements.videoHighlightsContent, elements.fifaRankingContent, elements.aiChatbotContent];
    const buttons = [elements.liveMatchesBtn, elements.videoHighlightsBtn, elements.fifaRankingBtn, elements.aiChatbotBtn];
    const isActive = elements[contentId]?.classList.contains('active');

    contents.forEach(content => content.classList.remove('active'));
    buttons.forEach(btn => btn.classList.remove('active'));

    if (contentId !== 'none' && !isActive) {
      elements[contentId].classList.add('active');
      elements[`${contentId.replace('Content', 'Btn')}`].classList.add('active');
      elements.widgetColumn.classList.add('expanded');
    } else {
      elements.widgetColumn.classList.remove('expanded');
    }
  }

  // Fetch with retry for sports APIs
  async function fetchWithRetry(url, options, retries = 2, delay = 1000) {
    for (let i = 0; i <= retries; i++) {
      try {
        if (!navigator.onLine) throw new Error('No internet connection.');
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 5000);
        options.signal = controller.signal;

        const res = await fetch(url, options);
        clearTimeout(timeoutId);

        if (!res.ok) {
          const error = new Error(`API error: ${res.status} ${res.statusText}`);
          error.status = res.status;
          throw error;
        }
        return await res.json();
      } catch (err) {
        if (i === retries || err.name === 'AbortError') {
          let message = err.name === 'AbortError' ? 'Request timed out.' : err.message;
          if (err.status === 429) message = 'API rate limit exceeded. Please try again later.';
          throw new Error(message);
        }
        console.warn(`Retrying fetch (${i + 1}/${retries}): ${url}`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }

  // Mock chatbot response
  async function fetchOpenAIResponse(message) {
    await new Promise(resolve => setTimeout(resolve, 1000));
    let response = "I'm sorry, I couldn't process your request. Please try again.";
    if (message.toLowerCase().includes('team')) {
      response = "Could you specify which team you'd like information about? For example, 'Tell me about Manchester United.'";
    } else if (message.toLowerCase().includes('player')) {
      response = "Please provide the player's name, like 'Cristiano Ronaldo,' and I can give you some details!";
    } else if (message.toLowerCase().includes('match') || message.toLowerCase().includes('game')) {
      response = "Which match are you interested in? Try specifying teams or a date, e.g., 'Arsenal vs Chelsea last match.'";
    } else {
      response = "I'm here to help with football-related questions! Ask about teams, players, matches, or predictions.";
    }
    return response;
  }

  // Handle chatbot message
  async function handleChatbotMessage() {
    const userMessage = elements.chatbotInput.value.trim();
    if (!userMessage) {
      elements.chatbotMessages.innerHTML += `
        <div class="chatbot-message bot">Please type a question or message!</div>
      `;
      elements.chatbotMessages.scrollTop = elements.chatbotMessages.scrollHeight;
      return;
    }

    chatbotConversation.push({ role: 'user', content: userMessage });
    elements.chatbotMessages.innerHTML += `
      <div class="chatbot-message user">${userMessage}</div>
    `;
    elements.chatbotInput.value = '';
    elements.chatbotMessages.scrollTop = elements.chatbotMessages.scrollHeight;

    showLoader();
    try {
      const botResponse = await fetchOpenAIResponse(userMessage);
      chatbotConversation.push({ role: 'assistant', content: botResponse });
      elements.chatbotMessages.innerHTML += `
        <div class="chatbot-message bot">${botResponse}</div>
      `;
    } catch (err) {
      console.error('Chatbot error:', err.message);
      elements.chatbotMessages.innerHTML += `
        <div class="chatbot-message bot">Error: ${err.message}</div>
      `;
    }
    elements.chatbotMessages.scrollTop = elements.chatbotMessages.scrollHeight;
    hideLoader();
  }

  // Fetch teams for autocomplete
  async function fetchTeams() {
    console.log("Fetching teams for autocomplete...");
    const cached = localStorage.getItem('teamCache');
    const cacheTime = localStorage.getItem('teamCacheTime');
    const now = Date.now();
    const oneDay = 24 * 60 * 60 * 1000;

    if (cached && cacheTime && (now - parseInt(cacheTime) < oneDay)) {
      console.log("Using cached teams.");
      return JSON.parse(cached);
    }

    try {
      const leagueIds = [4328, 4335, 4332, 4331, 4334];
      let allTeams = [];
      for (const leagueId of leagueIds) {
        const teamsUrl = `https://${sportsDbApiHost}/api/v1/json/${sportsDbApiKey}/lookup_all_teams.php?id=${leagueId}`;
        const data = await fetchWithRetry(teamsUrl, { method: 'GET', headers: { 'Content-Type': 'application/json' } });
        const teams = (data.teams || []).map(t => ({ name: t.strTeam }));
        allTeams = allTeams.concat(teams);
      }
      localStorage.setItem('teamCache', JSON.stringify(allTeams));
      localStorage.setItem('teamCacheTime', now.toString());
      console.log("Teams fetched and cached:", allTeams.length);
      return allTeams;
    } catch (err) {
      console.error('Error fetching teams:', err.message);
      return [];
    }
  }

  // Initialize teams
  fetchTeams().then(teams => {
    teamList = teams;
    console.log("Team list initialized:", teamList.length);
  });

  // Manage recent searches
  function getRecentSearches() {
    const searches = localStorage.getItem('recentSearches');
    return searches ? JSON.parse(searches) : [];
  }

  function addRecentSearch(query) {
    let searches = getRecentSearches();
    if (!searches.includes(query)) {
      searches.unshift(query);
      if (searches.length > 10) searches.pop();
      localStorage.setItem('recentSearches', JSON.stringify(searches));
    }
  }

  // Debounce function
  function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
      const later = () => {
        clearTimeout(timeout);
        func(...args);
      };
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  }

  // Fetch recent form
  async function fetchRecentForm(teamId, teamName) {
    const recentMatchesUrl = `https://${sportsDbApiHost}/api/v1/json/${sportsDbApiKey}/eventslast.php?id=${teamId}`;
    console.log("Fetching recent matches:", recentMatchesUrl);
    try {
      const data = await fetchWithRetry(recentMatchesUrl, { method: 'GET', headers: { 'Content-Type': 'application/json' } });
      const matches = data.results || [];
      const recentMatches = [];
      let winCount = 0, drawCount = 0, lossCount = 0;
      let homeWinCount = 0, awayWinCount = 0;

      matches.slice(0, 5).forEach(match => {
        const homeTeam = match.strHomeTeam;
        const awayTeam = match.strAwayTeam;
        const homeScore = parseInt(match.intHomeScore) || 0;
        const awayScore = parseInt(match.intAwayScore) || 0;
        if (!homeTeam || !awayTeam || isNaN(homeScore) || isNaN(awayScore)) {
          console.warn("Skipping invalid match:", match);
          return;
        }

        const isHome = homeTeam.toLowerCase() === teamName.toLowerCase();
        const teamScore = isHome ? homeScore : awayScore;
        const opponentScore = isHome ? awayScore : homeScore;

        if (teamScore > opponentScore) {
          winCount++;
          if (isHome) homeWinCount++;
          else awayWinCount++;
        } else if (teamScore === opponentScore) {
          drawCount++;
        } else {
          lossCount++;
        }

        recentMatches.push(`${homeTeam} ${homeScore} - ${awayScore} ${awayTeam}`);
      });

      const total = recentMatches.length;
      const winPercentage = total ? ((winCount / total) * 100).toFixed(1) : 0;
      const drawPercentage = total ? ((drawCount / total) * 100).toFixed(1) : 0;
      const lossPercentage = total ? ((lossCount / total) * 100).toFixed(1) : 0;
      const homeWinPercentage = total ? ((homeWinCount / total) * 100).toFixed(1) : 0;
      const awayWinPercentage = total ? ((awayWinCount / total) * 100).toFixed(1) : 0;

      const pieChartId = `pie-chart-${teamId}`;
      const barChartId = `bar-chart-${teamId}`;
      const matchesHtml = recentMatches.length ? `
        <p><strong>Last ${recentMatches.length} Matches:</strong></p>
        <ul style="list-style: none; padding-left: 0;">
          ${recentMatches.map(match => `<li>${match}</li>`).join('')}
        </ul>
      ` : '<p>No recent matches available.</p>';

      const chartHtml = `
        <h3>Recent Form: ${teamName}</h3>
        ${matchesHtml}
        <p><strong>Summary (Last ${total} Matches):</strong></p>
        <p>✅ Wins: <span class="highlight">${winCount} (${winPercentage}%)</span></p>
        <p>🤝 Draws: <span class="highlight">${drawCount} (${drawPercentage}%)</span></p>
        <p>❌ Losses: <span class="highlight">${lossCount} (${lossPercentage}%)</span></p>
        <p>🏠 Home Wins: <span class="highlight">${homeWinCount} (${homeWinPercentage}%)</span></p>
        <p>✈️ Away Wins: <span class="highlight">${awayWinCount} (${awayWinPercentage}%)</span></p>
        <div class="chart-container">
          <canvas id="${pieChartId}"></canvas>
        </div>
        <div class="chart-container">
          <canvas id="${barChartId}"></canvas>
        </div>
      `;

      const output = { 
        html: chartHtml,
        stats: { wins: winCount, draws: drawCount, losses: lossCount, homeWins: homeWinCount, awayWins: awayWinCount, winPercentage, drawPercentage, lossPercentage, homeWinPercentage, awayWinPercentage }
      };

      // Ensure canvas elements are in DOM before rendering charts
      setTimeout(() => {
        const pieCanvas = document.getElementById(pieChartId);
        const barCanvas = document.getElementById(barChartId);
        if (pieCanvas && barCanvas) {
          const pieCtx = pieCanvas.getContext('2d');
          const barCtx = barCanvas.getContext('2d');
          
          if (pieCtx) {
            const pieChart = new Chart(pieCtx, {
              type: 'pie',
              data: {
                labels: ['Wins', 'Draws', 'Losses'],
                datasets: [{
                  data: [winCount, drawCount, lossCount],
                  backgroundColor: ['#7cd4d2', '#387da0', '#242c58'],
                  borderColor: ['#fff', '#fff', '#fff'],
                  borderWidth: 1
                }]
              },
              options: {
                responsive: true,
                plugins: {
                  legend: { 
                    position: 'top', 
                    labels: { 
                      color: '#CBD5E1', 
                      font: { size: 12 } 
                    } 
                  },
                  title: { 
                    display: true, 
                    text: 'Match Outcomes', 
                    color: '#CBD5E1', 
                    font: { size: 14 } 
                  },
                  datalabels: {
                    color: '#fff',
                    font: { size: 10 },
                    formatter: (value, ctx) => {
                      const total = ctx.dataset.data.reduce((a, b) => a + b, 0);
                      const percentage = total ? ((value / total) * 100).toFixed(1) : 0;
                      return `${percentage}%`;
                    }
                  }
                }
              },
              plugins: [ChartDataLabels]
            });
            chartRegistry.set(pieChartId, pieChart);
          }

          if (barCtx) {
            const barChart = new Chart(barCtx, {
              type: 'bar',
              data: {
                labels: ['Home Wins', 'Away Wins'],
                datasets: [{
                  label: 'Wins',
                  data: [homeWinCount, awayWinCount],
                  backgroundColor: ['#2196f3', '#ff9800'],
                  borderColor: ['#fff', '#fff'],
                  borderWidth: 1
                }]
              },
              options: {
                responsive: true,
                plugins: {
                  legend: { 
                    display: false 
                  },
                  title: { 
                    display: true, 
                    text: 'Home vs Away Wins', 
                    color: '#CBD5E1', 
                    font: { size: 14 } 
                  },
                  datalabels: {
                    color: '#fff',
                    font: { size: 10 },
                    anchor: 'end',
                    align: 'top',
                    formatter: value => value
                  }
                },
                scales: {
                  y: { 
                    beginAtZero: true, 
                    ticks: { 
                      color: '#CBD5E1', 
                      font: { size: 10 } 
                    } 
                  },
                  x: { 
                    ticks: { 
                      color: '#CBD5E1', 
                      font: { size: 10 } 
                    } 
                  }
                }
              },
              plugins: [ChartDataLabels]
            });
            chartRegistry.set(barChartId, barChart);
          }
        } else {
          console.error("Canvas elements not found for charts:", pieChartId, barChartId);
        }
      }, 100); // Increased delay to ensure DOM is updated

      return output;
    } catch (err) {
      console.error("Error fetching recent matches:", err.message);
      return { html: `<span style="color: red;">Unable to fetch recent matches for ${teamName}. ${err.message}</span>` };
    }
  }

  // Fetch league standings
  async function fetchLeagueStandings(leagueId, season) {
    const standingsUrl = `https://${sportsDbApiHost}/api/v1/json/${sportsDbApiKey}/lookuptable.php?l=${leagueId}&s=${season.replace('/', '-')}`;
    console.log("Fetching standings:", standingsUrl);
    try {
      const data = await fetchWithRetry(standingsUrl, { method: 'GET', headers: { 'Content-Type': 'application/json' } });
      const standings = data.table || [];
      if (!standings.length) {
        return { html: `<span style="color: red;">No standings available for this league and season.</span>` };
      }

      const tableRows = standings.map(team => `
        <tr>
          <td>${team.intRank}</td>
          <td>${team.strTeam}</td>
          <td>${team.intPlayed}</td>
          <td>${team.intWin}</td>
          <td>${team.intDraw}</td>
          <td>${team.intLoss}</td>
          <td>${team.intGoalsFor}</td>
          <td>${team.intGoalsAgainst}</td>
          <td>${team.intGoalDifference}</td>
          <td>${team.intPoints}</td>
        </tr>
      `).join('');

      return {
        html: `
          <h3>League Standings (${season})</h3>
          <div class="standings-table">
            <table class="table table-dark table-striped table-hover">
              <thead>
                <tr>
                  <th>Pos</th>
                  <th>Team</th>
                  <th>P</th>
                  <th>W</th>
                  <th>D</th>
                  <th>L</th>
                  <th>GF</th>
                  <th>GA</th>
                  <th>GD</th>
                  <th>Pts</th>
                </tr>
              </thead>
              <tbody>${tableRows}</tbody>
            </table>
          </div>
        `
      };
    } catch (err) {
      console.error("Error fetching standings:", err.message);
      return { html: `<span style="color: red;">Unable to fetch standings: ${err.message}</span>` };
    }
  }

  // Compare teams
  async function compareTeams(teamId1, teamId2, teamName1, teamName2) {
    console.log(`Comparing teams: ${teamName1} vs ${teamName2}`);
    try {
      const [form1, form2] = await Promise.all([
        fetchRecentForm(teamId1, teamName1),
        fetchRecentForm(teamId2, teamName2)
      ]);

      let comparisonDialogue = `<h4>Team Comparison Analysis</h4>`;
      if (form1.stats && form2.stats) {
        if (form1.stats.winPercentage > form2.stats.winPercentage) {
          comparisonDialogue += `<p><span class="highlight">${teamName1}</span> has a stronger recent form with a win percentage of <span class="highlight">${form1.stats.winPercentage}%</span> compared to ${teamName2}'s <span class="highlight">${form2.stats.winPercentage}%</span>.</p>`;
        } else if (form1.stats.winPercentage < form2.stats.winPercentage) {
          comparisonDialogue += `<p><span class="highlight">${teamName2}</span> has a stronger recent form with a win percentage of <span class="highlight">${form2.stats.winPercentage}%</span> compared to ${teamName1}'s <span class="highlight">${form1.stats.winPercentage}%</span>.</p>`;
        } else {
          comparisonDialogue += `<p>Both <span class="highlight">${teamName1}</span> and <span class="highlight">${teamName2}</span> have similar recent form, each with a win percentage of <span class="highlight">${form1.stats.winPercentage}%</span>.</p>`;
        }

        if (form1.stats.homeWinPercentage > form2.stats.homeWinPercentage) {
          comparisonDialogue += `<p><span class="highlight">${teamName1}</span> dominates at home, securing <span class="highlight">${form1.stats.homeWinPercentage}%</span> of their wins at home compared to ${teamName2}'s <span class="highlight">${form2.stats.homeWinPercentage}%</span>.</p>`;
        } else if (form1.stats.homeWinPercentage < form2.stats.homeWinPercentage) {
          comparisonDialogue += `<p><span class="highlight">${teamName2}</span> dominates at home, securing <span class="highlight">${form2.stats.homeWinPercentage}%</span> of their wins at home compared to ${teamName1}'s <span class="highlight">${form1.stats.homeWinPercentage}%</span>.</p>`;
        } else {
          comparisonDialogue += `<p>Both teams show similar home performance, with ${teamName1} and ${teamName2} each securing <span class="highlight">${form1.stats.homeWinPercentage}%</span> of their wins at home.</p>`;
        }

        if (form1.stats.awayWinPercentage > form2.stats.awayWinPercentage) {
          comparisonDialogue += `<p><span class="highlight">${teamName1}</span> performs better away, with <span class="highlight">${form1.stats.awayWinPercentage}%</span> of wins on the road compared to ${teamName2}'s <span class="highlight">${form2.stats.awayWinPercentage}%</span>.</p>`;
        } else if (form1.stats.awayWinPercentage < form2.stats.awayWinPercentage) {
          comparisonDialogue += `<p><span class="highlight">${teamName2}</span> performs better away, with <span class="highlight">${form2.stats.awayWinPercentage}%</span> of wins on the road compared to ${teamName1}'s <span class="highlight">${form1.stats.awayWinPercentage}%</span>.</p>`;
        } else {
          comparisonDialogue += `<p>Both teams have comparable away performance, with ${teamName1} and ${teamName2} each securing <span class="highlight">${form1.stats.awayWinPercentage}%</span> of wins away.</p>`;
        }

        if (form1.stats.drawPercentage > form2.stats.drawPercentage) {
          comparisonDialogue += `<p><span class="highlight">${teamName1}</span> tends to draw more often, with a draw percentage of <span class="highlight">${form1.stats.drawPercentage}%</span> compared to ${teamName2}'s <span class="highlight">${form2.stats.drawPercentage}%</span>.</p>`;
        } else if (form1.stats.drawPercentage < form2.stats.drawPercentage) {
          comparisonDialogue += `<p><span class="highlight">${teamName2}</span> tends to draw more often, with a draw percentage of <span class="highlight">${form2.stats.drawPercentage}%</span> compared to ${teamName1}'s <span class="highlight">${form1.stats.drawPercentage}%</span>.</p>`;
        } else {
          comparisonDialogue += `<p>Both teams have a similar tendency to draw, with ${teamName1} and ${teamName2} each at <span class="highlight">${form1.stats.drawPercentage}%</span> draws.</p>`;
        }

        if (form1.stats.wins === 0 && form2.stats.wins === 0) {
          comparisonDialogue += `<p>Neither team has secured a win in their last 5 matches, indicating a potential struggle in recent performances.</p>`;
        } else if (form1.stats.wins + form1.stats.draws === 5 || form2.stats.wins + form2.stats.draws === 5) {
          const team = form1.stats.wins + form1.stats.draws === 5 ? teamName1 : teamName2;
          comparisonDialogue += `<p><span class="highlight">${team}</span> has been exceptionally consistent, avoiding defeat in their last 5 matches.</p>`;
        }
      } else {
        comparisonDialogue += `<p>Insufficient data to compare recent form between ${teamName1} and ${teamName2}.</p>`;
      }

      const parser = new DOMParser();
      const doc2 = parser.parseFromString(form2.html, 'text/html');
      const matches2 = Array.from(doc2.querySelectorAll('ul li')).map(li => li.textContent);

      const comparisonTable = `
        <h3>Comparison: ${teamName1} vs ${teamName2}</h3>
        <table class="table table-dark table-striped table-hover">
          <thead>
            <tr>
              <th>Metric</th>
              <th>${teamName1}</th>
              <th>${teamName2}</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Wins</td>
              <td><span class="highlight">${form1.stats.wins}</span></td>
              <td><span class="highlight">${form2.stats.wins}</span></td>
            </tr>
            <tr>
              <td>Draws</td>
              <td><span class="highlight">${form1.stats.draws}</span></td>
              <td><span class="highlight">${form2.stats.draws}</span></td>
            </tr>
            <tr>
              <td>Losses</td>
              <td><span class="highlight">${form1.stats.losses}</span></td>
              <td><span class="highlight">${form2.stats.losses}</span></td>
            </tr>
            <tr>
              <td>Home Wins</td>
              <td><span class="highlight">${form1.stats.homeWins}</span></td>
              <td><span class="highlight">${form2.stats.homeWins}</span></td>
            </tr>
            <tr>
              <td>Away Wins</td>
              <td><span class="highlight">${form1.stats.awayWins}</span></td>
              <td><span class="highlight">${form2.stats.awayWins}</span></td>
            </tr>
            <tr>
              <td>Win %</td>
              <td><span class="highlight">${form1.stats.winPercentage}%</span></td>
              <td><span class="highlight">${form2.stats.winPercentage}%</span></td>
            </tr>
            <tr>
              <td>Draw %</td>
              <td><span class="highlight">${form1.stats.drawPercentage}%</span></td>
              <td><span class="highlight">${form2.stats.drawPercentage}%</span></td>
            </tr>
            <tr>
              <td>Loss %</td>
              <td><span class="highlight">${form1.stats.lossPercentage}%</span></td>
              <td><span class="highlight">${form2.stats.lossPercentage}%</span></td>
            </tr>
          </tbody>
        </table>
      `;

      const radarChartId = `radar-chart-compare-${teamId1}-${teamId2}`;
      const chartHtml = `
        ${comparisonDialogue}
        <h3>Recent Form: ${teamName2}</h3>
        ${matches2.length ? `
          <p><strong>Last ${matches2.length} Matches:</strong></p>
          <ul style="list-style: none; padding-left: 0;">
            ${matches2.map(match => `<li>${match}</li>`).join('')}
          </ul>
        ` : '<p>No recent matches available.</p>'}
        <p><strong>Summary (Last 5 Matches):</strong></p>
        <p>✅ Wins: <span class="highlight">${form2.stats.wins} (${form2.stats.winPercentage}%)</span></p>
        <p>🤝 Draws: <span class="highlight">${form2.stats.draws} (${form2.stats.drawPercentage}%)</span></p>
        <p>❌ Losses: <span class="highlight">${form2.stats.losses} (${form2.stats.lossPercentage}%)</span></p>
        <p>🏠 Home Wins: <span class="highlight">${form2.stats.homeWins} (${form2.stats.homeWinPercentage}%)</span></p>
        <p>✈️ Away Wins: <span class="highlight">${form2.stats.awayWins} (${form2.stats.awayWinPercentage}%)</span></p>
        <div class="chart-container">
          <canvas id="${radarChartId}"></canvas>
        </div>
        ${comparisonTable}
      `;

      const output = {
        html: chartHtml + form1.html,
        charts: [radarChartId]
      };

      setTimeout(() => {
        const radarCanvas = document.getElementById(radarChartId);
        if (radarCanvas) {
          const radarCtx = radarCanvas.getContext('2d');
          if (radarCtx) {
            const radarChart = new Chart(radarCtx, {
              type: 'radar',
              data: {
                labels: ['Wins', 'Draws', 'Losses', 'Home Wins', 'Away Wins'],
                datasets: [
                  {
                    label: teamName1,
                    data: [form1.stats.wins, form1.stats.draws, form1.stats.losses, form1.stats.homeWins, form1.stats.awayWins],
                    fill: true,
                    backgroundColor: 'rgba(33, 150, 243, 0.2)',
                    borderColor: '#2196f3',
                    pointBackgroundColor: '#2196f3',
                    pointBorderColor: '#fff',
                    pointHoverBackgroundColor: '#fff',
                    pointHoverBorderColor: '#2196f3'
                  },
                  {
                    label: teamName2,
                    data: [form2.stats.wins, form2.stats.draws, form2.stats.losses, form2.stats.homeWins, form2.stats.awayWins],
                    fill: true,
                    backgroundColor: 'rgba(255, 152, 0, 0.2)',
                    borderColor: '#ff9800',
                    pointBackgroundColor: '#ff9800',
                    pointBorderColor: '#fff',
                    pointHoverBackgroundColor: '#fff',
                    pointHoverBorderColor: '#ff9800'
                  }
                ]
              },
              options: {
                responsive: true,
                plugins: {
                  legend: { position: 'top', labels: { color: '#CBD5E1', font: { size: 12 } } },
                  title: { display: true, text: 'Team Performance Comparison', color: '#CBD5E1', font: { size: 14 } }
                },
                scales: {
                  r: {
                    angleLines: { color: 'rgba(255, 255, 255, 0.3)' },
                    grid: { color: 'rgba(255, 255, 255, 0.3)' },
                    pointLabels: { color: '#CBD5E1', font: { size: 10 } },
                    ticks: { display: false }
                  }
                }
              }
            });
            chartRegistry.set(radarChartId, radarChart);
          }
        } else {
          console.error("Radar canvas not found:", radarChartId);
        }
      }, 100);

      return output;
    } catch (err) {
      console.error("Error comparing teams:", err.message);
      return { html: `<span style="color: red;">Unable to compare teams: ${err.message}</span>` };
    }
  }

  // Fetch team by ID
  async function fetchTeamById(teamId) {
    const teamUrl = `https://${sportsDbApiHost}/api/v1/json/${sportsDbApiKey}/lookupteam.php?id=${teamId}`;
    console.log("Fetching team by ID:", teamUrl);
    try {
      const data = await fetchWithRetry(teamUrl, { method: 'GET', headers: { 'Content-Type': 'application/json' } });
      return data.teams && data.teams[0] ? data.teams[0] : null;
    } catch (err) {
      console.error("Error fetching team by ID:", err.message);
      return null;
    }
  }

  // Fetch team by name
  async function fetchTeamByName(teamName) {
    const searchUrl = `https://${sportsDbApiHost}/api/v1/json/${sportsDbApiKey}/searchteams.php?t=${encodeURIComponent(teamName)}`;
    console.log("Fetching team by name:", searchUrl);
    try {
      const data = await fetchWithRetry(searchUrl, { method: 'GET', headers: { 'Content-Type': 'application/json' } });
      return data.teams && data.teams[0] ? data.teams[0] : null;
    } catch (err) {
      console.error("Error fetching team by name:", err.message);
      return null;
    }
  }

  // Search suggestions
  function showSuggestions(query) {
    console.log("Showing suggestions for query:", query);
    elements.suggestionsBox.innerHTML = '';
    if (!query) {
      const recentSearches = getRecentSearches();
      if (recentSearches.length) {
        elements.suggestionsBox.innerHTML = recentSearches.map(search => `
          <div data-suggestion="${search}"><i class="fas fa-history"></i>${search}</div>
        `).join('');
        elements.suggestionsBox.style.display = 'block';
      } else {
        elements.suggestionsBox.style.display = 'none';
      }
      return;
    }

    const filteredTeams = teamList.filter(team =>
      team.name.toLowerCase().includes(query.toLowerCase())
    ).slice(0, 5);
    elements.suggestionsBox.innerHTML = filteredTeams.map(team => `
      <div data-suggestion="${team.name}"><i class="fas fa-futbol"></i>${team.name}</div>
    `).join('');
    elements.suggestionsBox.style.display = filteredTeams.length ? 'block' : 'none';
  }

  // Handle search
  async function handleSearch() {
    const query = elements.teamInput.value.trim();
    if (!query) {
      elements.searchResults.innerHTML = '<span style="color: red;">Please enter a team name, player ID, or comparison query (e.g., "Arsenal vs Chelsea").</span>';
      return;
    }
    console.log("Handling search for query:", query);
    showLoader();
    elements.searchResults.innerHTML = '';
    elements.output.innerHTML = '';
    elements.suggestionsBox.innerHTML = '';
    elements.suggestionsBox.style.display = 'none';
    elements.searchResults.classList.add('active');
    elements.output.classList.remove('active');
    destroyCharts();
    addRecentSearch(query);
    toggleWidgetContent('none');

    const comparisonMatch = query.match(/^(.+?)\s*vs\s*(.+)$/i);
    if (comparisonMatch) {
      const [, team1, team2] = comparisonMatch;
      console.log(`Comparison query detected: ${team1} vs ${team2}`);
      const team1Data = await fetchTeamByName(team1.trim());
      const team2Data = await fetchTeamByName(team2.trim());
      if (!team1Data || !team2Data) {
        elements.searchResults.innerHTML = `<span style="color: red;">One or both teams not found: ${team1}, ${team2}</span>`;
        hideLoader();
        return;
      }
      const comparison = await compareTeams(team1Data.idTeam, team2Data.idTeam, team1Data.strTeam, team2Data.strTeam);
      elements.output.innerHTML = `<div class="data-card active">${comparison.html}</div>`;
      elements.output.classList.add('active');
      hideLoader();
      return;
    }

    const isId = /^\d+$/.test(query);
    const team = isId ? await fetchTeamById(query) : await fetchTeamByName(query);
    if (!team) {
      elements.searchResults.innerHTML = `<span style="color: red;">Team not found: ${query}</span>`;
      hideLoader();
      return;
    }

    const teamId = team.idTeam;
    const teamName = team.strTeam;
    let description = team.strDescriptionEN || 'No description available.';
    if (description.length > 500) {
      const truncated = description.substring(0, 500);
      const lastPeriod = truncated.lastIndexOf('.');
      description = lastPeriod > 0 ? truncated.substring(0, lastPeriod + 1) : truncated + '...';
    }

    const teamDetails = `
      <div class="data-card active">
        <h3>${team.strTeam}</h3>
        <p><strong>League:</strong> ${team.strLeague || 'N/A'}</p>
        <p><strong>Country:</strong> ${team.strCountry || 'N/A'}</p>
        <p><strong>Stadium:</strong> ${team.strStadium || 'N/A'}</p>
        <p><strong>Founded:</strong> ${team.intFormedYear || 'N/A'}</p>
        <p><strong>Description:</strong> ${description}</p>
        <div class="d-flex flex-column gap-2 mt-2">
          <span class="clickable-text" id="teamFormBtn"><i class="fas fa-chart-line"></i> Recent Form</span>
          <div class="standings-dropdown">
            <span class="clickable-text" id="standingsBtn"><i class="fas fa-trophy"></i> League Standings</span>
            <div class="standings-menu" id="standingsMenu"></div>
          </div>
          <input type="text" id="compareTeamInput" placeholder="Enter team to compare..." aria-label="Enter team to compare">
          <span class="clickable-text" id="compareTeamBtn"><i class="fas fa-balance-scale"></i> Compare Teams</span>
          <div id="compare-suggestions" class="suggestions-box"></div>
        </div>
      </div>
    `;

    elements.searchResults.innerHTML = teamDetails;

    // Populate standings dropdown
    const standingsMenu = document.getElementById('standingsMenu');
    standingsMenu.innerHTML = Object.keys(leagueMap).map(league => `
      <div class="league-item" data-league="${league}">
        ${league}
        <i class="fas fa-chevron-right"></i>
        <div class="years-submenu">
          ${seasons.filter(s => s.format === leagueMap[league].seasonFormat).map(s => `
            <div data-season="${s.value}">${s.display}</div>
          `).join('')}
        </div>
      </div>
    `).join('');

    // Event listeners for standings dropdown
    standingsMenu.querySelectorAll('div.league-item').forEach(div => {
      div.querySelectorAll('.years-submenu div').forEach(yearDiv => {
        yearDiv.addEventListener('click', async () => {
          showLoader();
          standingsMenu.classList.remove('active');
          const output = await fetchLeagueStandings(leagueMap[div.dataset.league].id, yearDiv.dataset.season);
          elements.output.innerHTML = `<div class="data-card active">${output.html}</div>`;
          elements.output.classList.add('active');
          hideLoader();
        });
      });
    });

    document.getElementById('teamFormBtn').addEventListener('click', async () => {
      showLoader();
      const output = await fetchRecentForm(teamId, teamName);
      elements.output.innerHTML = `<div class="data-card active">${output.html}</div>`;
      elements.output.classList.add('active');
      hideLoader();
    });

    document.getElementById('standingsBtn').addEventListener('click', () => {
      standingsMenu.classList.toggle('active');
    });

    // Event listeners for compare team input
    const compareInput = document.getElementById('compareTeamInput');
    const compareBtn = document.getElementById('compareTeamBtn');
    const compareSuggestions = document.getElementById('compare-suggestions');

    compareInput.addEventListener('input', debounce(async () => {
      const query = compareInput.value.trim();
      if (!query) {
        compareSuggestions.style.display = 'none';
        return;
      }
      const matchedTeams = teamList.filter(team => team.name.toLowerCase().includes(query.toLowerCase())).slice(0, 5);
      compareSuggestions.innerHTML = matchedTeams.map(team => `
        <div data-name="${team.name}">
          ${team.name}
        </div>
      `).join('');
      compareSuggestions.style.display = matchedTeams.length ? 'block' : 'none';

      compareSuggestions.querySelectorAll('div').forEach(div => {
        div.addEventListener('click', () => {
          compareInput.value = div.dataset.name;
          compareSuggestions.style.display = 'none';
        });
      });
    }, 300));

    compareBtn.addEventListener('click', async () => {
      const compareTeamName = compareInput.value.trim();
      if (!compareTeamName) {
        elements.output.innerHTML = '<span style="color: red;">Please enter a team to compare.</span>';
        elements.output.classList.add('active');
        return;
      }

      showLoader();
      const compareTeam = await fetchTeamByName(compareTeamName);
      if (!compareTeam) {
        hideLoader();
        elements.output.innerHTML = `<span style="color: red;">No team found for "${compareTeamName}".</span>`;
        elements.output.classList.add('active');
        return;
      }
      const output = await compareTeams(team.idTeam, compareTeam.idTeam, team.strTeam, compareTeam.strTeam);
      elements.output.innerHTML = `<div class="data-card active">${output.html}</div>`;
      elements.output.classList.add('active');
      hideLoader();
    });

    // Close dropdown when clicking outside
    document.addEventListener('click', (e) => {
      if (!standingsMenu.contains(e.target) && !document.getElementById('standingsBtn').contains(e.target)) {
        standingsMenu.classList.remove('active');
      }
    });

    hideLoader();
    elements.widgetColumn.classList.add('expanded');
  }

  // Clear search
  function clearSearch() {
    console.log("Clearing search...");
    elements.teamInput.value = '';
    elements.searchResults.innerHTML = '';
    elements.output.innerHTML = '';
    elements.searchResults.classList.remove('active');
    elements.output.classList.remove('active');
    elements.suggestionsBox.style.display = 'none';
    destroyCharts();
    toggleWidgetContent('none');
  }

  // Share functionality
  function shareContent(platform) {
    const url = window.location.href;
    const text = `Check out this Football Assistant for the latest team stats!`;
    let shareUrl = '';
    switch (platform) {
      case 'whatsapp':
        shareUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(text + ' ' + url)}`;
        break;
      case 'facebook':
        shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`;
        break;
      case 'twitter':
        shareUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`;
        break;
      case 'linkedin':
        shareUrl = `https://www.linkedin.com/shareArticle?mini=true&url=${encodeURIComponent(url)}&title=${encodeURIComponent('Football Assistant')}&summary=${encodeURIComponent(text)}`;
        break;
      default:
        return;
    }
    window.open(shareUrl, '_blank');
    console.log(`Sharing on ${platform}: ${shareUrl}`);
  }

  // Event Listeners
  elements.teamInput.addEventListener('input', debounce(() => {
    showSuggestions(elements.teamInput.value);
  }, 300));

  elements.teamInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  });

  elements.suggestionsBox.addEventListener('click', (e) => {
    const suggestion = e.target.closest('div[data-suggestion]');
    if (suggestion) {
      elements.teamInput.value = suggestion.dataset.suggestion;
      elements.suggestionsBox.style.display = 'none';
      handleSearch();
    }
  });

  elements.searchBtn.addEventListener('click', handleSearch);
  elements.clearBtn.addEventListener('click', clearSearch);
  elements.videoClose.addEventListener('click', () => elements.videoPopup.style.display = 'none');
  elements.liveMatchesBtn.addEventListener('click', () => toggleWidgetContent('liveMatchesContent'));
  elements.videoHighlightsBtn.addEventListener('click', () => toggleWidgetContent('videoHighlightsContent'));
  elements.fifaRankingBtn.addEventListener('click', () => toggleWidgetContent('fifaRankingContent'));
  elements.aiChatbotBtn.addEventListener('click', () => toggleWidgetContent('aiChatbotContent'));
  elements.shareBtn.addEventListener('click', () => {
    const isVisible = elements.socialShareButtons.style.display === 'flex';
    elements.socialShareButtons.style.display = isVisible ? 'none' : 'flex';
    console.log(isVisible ? "Hiding share buttons" : "Showing share buttons");
  });
  elements.whatsappShare.addEventListener('click', () => shareContent('whatsapp'));
  elements.facebookShare.addEventListener('click', () => shareContent('facebook'));
  elements.twitterShare.addEventListener('click', () => shareContent('twitter'));
  elements.linkedinShare.addEventListener('click', () => shareContent('linkedin'));
  elements.chatbotSendBtn.addEventListener('click', handleChatbotMessage);
  elements.chatbotInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') handleChatbotMessage();
  });

  // Handle clicks outside suggestions
  document.addEventListener('click', (e) => {
    if (!elements.teamInput.contains(e.target) && !elements.suggestionsBox.contains(e.target)) {
      elements.suggestionsBox.style.display = 'none';
    }
    if (!elements.shareBtn.contains(e.target) && !elements.socialShareButtons.contains(e.target)) {
      elements.socialShareButtons.style.display = 'none';
    }
  });

  // Initialize
  console.log("Initialization complete.");
  toggleWidgetContent('none');
});