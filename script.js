const leadStory = document.querySelector("#lead-story");
const railList = document.querySelector("#news-rail-list");
const storyList = document.querySelector("#story-list");

const formatter = new Intl.DateTimeFormat("tr-TR", {
  day: "2-digit",
  month: "2-digit",
  year: "numeric"
});

function formatDate(value) {
  const date = new Date(`${value}T12:00:00`);
  return formatter.format(date);
}

function sortNewestFirst(articles) {
  return [...articles].sort((a, b) => new Date(b.date) - new Date(a.date));
}

function createPreview(article) {
  const preview = document.createElement("article");
  preview.className = "post-preview";

  const date = document.createElement("p");
  date.className = "date";
  date.textContent = formatDate(article.date);

  const heading = document.createElement("h3");
  const link = document.createElement("a");
  link.href = article.url;
  link.textContent = article.title;
  heading.append(link);

  const media = createArticleImage(article, "preview-media");

  const summary = document.createElement("p");
  summary.textContent = article.summary;

  preview.append(date, heading);
  if (media) {
    preview.append(media);
  }
  preview.append(summary);
  return preview;
}

function createArticleImage(article, className) {
  if (!article.image) {
    return null;
  }

  const link = document.createElement("a");
  link.className = className;
  link.href = article.url;

  const image = document.createElement("img");
  image.src = article.image;
  image.alt = article.title;
  image.loading = "lazy";

  link.append(image);
  return link;
}

function renderLead(article) {
  leadStory.innerHTML = "";

  if (article.image) {
    leadStory.style.setProperty("--lead-image", `url("${article.image}")`);
  }

  const kicker = document.createElement("p");
  kicker.className = "kicker";
  kicker.textContent = article.category || "Son Dakika";

  const date = document.createElement("p");
  date.className = "date";
  date.textContent = formatDate(article.date);

  const heading = document.createElement("h1");
  const link = document.createElement("a");
  link.href = article.url;
  link.textContent = article.title;
  heading.append(link);

  const media = createArticleImage(article, "lead-media");

  const summary = document.createElement("p");
  summary.className = "summary";
  summary.textContent = article.summary;

  leadStory.append(kicker, date, heading);
  if (media) {
    leadStory.append(media);
  }
  leadStory.append(summary);
}

function renderArticles(articles) {
  const sorted = sortNewestFirst(articles);
  const featured = sorted.find((article) => article.featured) || sorted[0];
  const remaining = sorted.filter((article) => article !== featured);

  renderLead(featured);

  railList.replaceChildren(...remaining.slice(0, 2).map(createPreview));
  storyList.replaceChildren(...remaining.slice(2).map(createPreview));

  if (storyList.children.length === 0) {
    const empty = document.createElement("p");
    empty.className = "loading-message";
    empty.textContent = "Daha fazla haber bulunmuyor.";
    storyList.append(empty);
  }
}

function showLoadError() {
  leadStory.innerHTML = `
    <p class="kicker">Hata</p>
    <p class="date">Arsiv okunamadi</p>
    <h1>Haberler yuklenemedi</h1>
    <p class="summary">articles.json dosyasi kontrol edilmeli veya sayfa yerel bir sunucuda acilmali.</p>
  `;
  railList.replaceChildren();
  storyList.innerHTML = '<p class="loading-message">Haber listesi su anda gosterilemiyor.</p>';
}

fetch("articles.json")
  .then((response) => {
    if (!response.ok) {
      throw new Error("Article data could not be loaded.");
    }
    return response.json();
  })
  .then(renderArticles)
  .catch(showLoadError);
