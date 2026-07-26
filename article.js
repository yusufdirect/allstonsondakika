const currentArticlePath = `articles/${window.location.pathname.split("/").pop()}`;
const articleFigure = document.querySelector(".article-media");

function imagePathForArticlePage(path) {
  if (!path) {
    return "";
  }

  if (path.startsWith("http://") || path.startsWith("https://") || path.startsWith("../")) {
    return path;
  }

  return `../${path}`;
}

function updateArticleImage(article) {
  if (!articleFigure) {
    return;
  }

  if (!article?.image) {
    const existingImage = articleFigure.querySelector("img");

    if (existingImage?.getAttribute("src") === "IMAGE_URL") {
      articleFigure.hidden = true;
    }

    return;
  }

  let image = articleFigure.querySelector("img");

  if (!image) {
    image = document.createElement("img");
    articleFigure.append(image);
  }

  image.src = imagePathForArticlePage(article.image);
  image.alt = article.title;
  articleFigure.hidden = false;
}

fetch("../articles.json")
  .then((response) => {
    if (!response.ok) {
      throw new Error("Article data could not be loaded.");
    }
    return response.json();
  })
  .then((articles) => {
    const article = articles.find((item) => item.url === currentArticlePath);
    updateArticleImage(article);
  })
  .catch(() => {
    // Keep the image already written in the HTML as a fallback.
  });
