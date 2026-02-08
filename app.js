const API_KEY = "55bff8c9";
// const API_KEY = "67b1bcd";
// const API_KEY = "d2478b0a";
const JSON_URL = "https://raw.githubusercontent.com/Javidd01/movie-info-in-json/refs/heads/main/movies.json";
const ITEMS_PER_PAGE = 20;

const grid = document.getElementById("movieGrid");
const modal = document.getElementById("movieModal");
const modalBody = document.getElementById("modalBody");
const closeModal = document.getElementById("closeModal");
const searchInput = document.getElementById("searchInput");

let allMovies = [];
let filteredMovies = [];
let currentPage = 1;

const posterProxy = url =>
  `https://images.weserv.nl/?url=${encodeURIComponent(url)}&w=400`;

async function loadMovies() {
  const res = await fetch(JSON_URL);
  const data = await res.json();
  allMovies = Array.isArray(data) ? data : data.movies;
  filteredMovies = allMovies;
  renderPage();
}

async function renderPage() {
  grid.innerHTML = "";

  const start = (currentPage - 1) * ITEMS_PER_PAGE;
  const pageItems = filteredMovies.slice(start, start + ITEMS_PER_PAGE);

  for (const movie of pageItems) {
    const card = document.createElement("div");
    card.className = "movie-card";
    card.onclick = () => openModal(movie);

    let omdb = {};
    if (movie.imdb?.code) {
      try {
        const res = await fetch(
          `https://www.omdbapi.com/?apikey=${API_KEY}&i=${movie.imdb.code}`
        );
        omdb = await res.json();
      } catch (e) {
        omdb = {};
      }
    }

    card.innerHTML = `
      <img src="${posterProxy(omdb.Poster || movie.poster)}">
      <div class="movie-info">
        <div class="movie-title">${movie.title}</div>
        <div class="movie-meta">${movie.year || ""}</div>
      </div>
    `;

    grid.appendChild(card);
  }

  renderPagination();
}



function renderPagination() {
  let pagination = document.getElementById("pagination");
  if (!pagination) {
    pagination = document.createElement("div");
    pagination.id = "pagination";
    pagination.className = "pagination";
    document.body.appendChild(pagination);
  }

  const totalPages = Math.ceil(filteredMovies.length / ITEMS_PER_PAGE);
  pagination.innerHTML = "";

  if (totalPages <= 1) return;

  const maxVisible = 5;
  let startPage = Math.max(1, currentPage - Math.floor(maxVisible / 2));
  let endPage = startPage + maxVisible - 1;

  if (endPage > totalPages) {
    endPage = totalPages;
    startPage = Math.max(1, endPage - maxVisible + 1);
  }

  // صفحه اول
  if (startPage > 1) {
    addPageButton(1);
    if (startPage > 2) addDots();
  }

  // صفحات میانی
  for (let i = startPage; i <= endPage; i++) {
    addPageButton(i, i === currentPage);
  }

  // صفحه آخر
  if (endPage < totalPages) {
    if (endPage < totalPages - 1) addDots();
    addPageButton(totalPages);
  }

  function addPageButton(page, active = false) {
    const btn = document.createElement("button");
    btn.textContent = page;
    btn.className = "page-btn" + (active ? " active" : "");
    btn.onclick = () => {
      currentPage = page;
      renderPage();
      window.scrollTo({ top: 0, behavior: "smooth" });
    };
    pagination.appendChild(btn);
  }

  function addDots() {
    const span = document.createElement("span");
    span.textContent = "...";
    span.className = "dots";
    pagination.appendChild(span);
  }
}


async function openModal(movie) {
  modal.classList.remove("hidden");
  modalBody.innerHTML = "در حال بارگذاری اطلاعات...";

  let omdb = {};
  if (movie.imdb?.code) {
    const res = await fetch(
      `https://www.omdbapi.com/?apikey=${API_KEY}&i=${movie.imdb.code}&plot=full`
    );
    omdb = await res.json();
  }

  modalBody.innerHTML = `
    <div class="detail">
      <img src="${posterProxy(omdb.Poster || movie.poster)}">
      <div>
        <h2>${omdb.Title || movie.title}</h2>
        <p>${omdb.Plot || ""}</p>
        <p>🎭 ${omdb.Genre || "-"}</p>
        <p>⭐ IMDb: ${omdb.imdbRating || "-"}</p>

        <div class="downloads">
          <h3>لینک‌های دانلود</h3>
          ${renderDownloads(movie.downloads)}
        </div>
      </div>
    </div>
  `;
}

function renderDownloads(downloads) {
  if (!downloads || !downloads.length)
    return "<span>لینک دانلود موجود نیست</span>";

  return downloads
    .map(d => `
      <a href="${d.url}" target="_blank" rel="noopener">
        ${d.type} | ${d.quality.replace(/\s+/g, " ")} | ${d.size}
      </a>
    `)
    .join("");
}

searchInput.addEventListener("input", e => {
  const q = e.target.value.trim().toLowerCase();
  currentPage = 1;

  filteredMovies = allMovies.filter(m =>
    m.title?.toLowerCase().includes(q) ||
    m.year?.toString().includes(q) ||
    m.imdb?.code?.toLowerCase().includes(q)
  );

  renderPage();
});

closeModal.onclick = () => modal.classList.add("hidden");
modal.onclick = e => {
  if (e.target === modal) modal.classList.add("hidden");
};

loadMovies();
