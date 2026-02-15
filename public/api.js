let tokenTimerInterval;

export function clearAccessTokenTimer() {
  console.log('clearAccessTokenTimer called');
  if (tokenTimerInterval) clearInterval(tokenTimerInterval);
  const el = document.getElementById("token-timer");
  if (el) {
    el.textContent = "";
    console.log('Cleared timer element text');
  } else {
    console.log('Timer element not found');
  }
}

export function startAccessTokenTimer(expMs) {
  console.log('startAccessTokenTimer called with expMs:', expMs);
  const timerEl = document.getElementById("token-timer");
  if (!timerEl) {
    console.log('Timer element not found');
    return;
  }
  console.log('Timer element found, starting timer');

  if (tokenTimerInterval) clearInterval(tokenTimerInterval);

  tokenTimerInterval = setInterval(() => {
    const remaining = expMs - Date.now();

    if (remaining <= 0) {
      timerEl.textContent = "Expired";
      console.log('Session expired');
      clearInterval(tokenTimerInterval);
      return;
    }

    const m = Math.floor(remaining / 60000);
    const s = Math.floor((remaining % 60000) / 1000).toString().padStart(2, "0");

    timerEl.textContent = `${m}:${s}`;

    timerEl.className = "ml-auto text-sm font-mono " + (remaining < 60000 ? "text-red-300" : remaining < 180000 ? "text-yellow-200" : "opacity-90");
  }, 1000);
}
