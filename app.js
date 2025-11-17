// frontend/app.js
const searchInput = document.getElementById('searchInput');
const searchBtn = document.getElementById('searchBtn');
const pdfOnly = document.getElementById('pdfOnly');
const resultsGrid = document.getElementById('resultsGrid');
const resultsInfo = document.getElementById('resultsInfo');

async function doSearch() {
  const q = searchInput.value.trim();
  if (!q) {
    alert('Please type a search term (e.g. "computer engineering networks pdf")');
    return;
  }

  resultsInfo.classList.add('hidden');
  resultsGrid.innerHTML = '<p style="grid-column:1/-1;padding:18px;color:#6b7280">Searching the web… this may take a few seconds...</p>';

  try {
    const resp = await fetch('/api/search', {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify({
        query: q,
        limit: 20,
        preferPdf: pdfOnly.checked
      })
    });

    if (!resp.ok) {
      const err = await resp.json().catch(()=>({error:'unknown'}));
      resultsGrid.innerHTML = `<p style="grid-column:1/-1;padding:18px;color:#ff4d4f">Search failed: ${err?.error || resp.statusText}</p>`;
      return;
    }

    const data = await resp.json();
    const items = data.results || [];
    resultsGrid.innerHTML = '';

    resultsInfo.textContent = `Showing ${items.length} results for "${data.query}" (search refined to: "${data.rewritten}")`;
    resultsInfo.classList.remove('hidden');

    if (items.length === 0) {
      resultsGrid.innerHTML = `<p style="grid-column:1/-1;padding:18px;color:#6b7280">No results found. Try a broader query.</p>`;
      return;
    }

    items.forEach(it => {
      const card = document.createElement('div');
      card.className = 'card';

      const title = document.createElement('h3');
      title.textContent = it.title || (it.raw && (it.raw.title || it.raw.name)) || (it.link || 'Untitled');
      card.appendChild(title);

      const snippet = document.createElement('p');
      snippet.textContent = it.snippet || (it.raw && (it.raw.snippet || it.raw.excerpt)) || '';
      card.appendChild(snippet);

      const meta = document.createElement('div');
      meta.className = 'meta';

      const source = document.createElement('div');
      source.textContent = it.source || (it.link ? (new URL(it.link)).hostname : '');
      meta.appendChild(source);

      const actions = document.createElement('div');
      actions.className = 'actions';

      if (it.link) {
        const a = document.createElement('a');
        a.href = it.link;
        a.target = '_blank';
        a.rel = 'noopener noreferrer';
        a.className = 'link-btn';
        a.textContent = 'Open';
        actions.appendChild(a);
      } else {
        const na = document.createElement('span');
        na.className = 'link-btn';
        na.textContent = 'No link';
        actions.appendChild(na);
      }

      meta.appendChild(actions);
      card.appendChild(meta);

      resultsGrid.appendChild(card);
    });

  } catch (err) {
    console.error(err);
    resultsGrid.innerHTML = `<p style="grid-column:1/-1;padding:18px;color:#ff4d4f">Search failed — network or server error</p>`;
  }
}

searchBtn.addEventListener('click', doSearch);
searchInput.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') doSearch();
});