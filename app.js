/* Black History — The Marquee. Choose a film, the curtains part, history plays. */
(function () {
  "use strict";
  function $(id) { return document.getElementById(id); }

  var player = $("player"), screenWrap = $("screenWrap"),
      filmTitle = $("filmTitle"), filmYear = $("filmYear"), filmNote = $("filmNote"),
      kicker = $("kicker"), idleMsg = $("idleMsg"),
      filmGrid = $("filmGrid"), grain = $("grain");

  var films = [], curFilm = null;

  /* ---------- chasing bulbs around the marquee ---------- */
  (function bulbs() {
    var box = $("bulbs"), N = 28;
    for (var i = 0; i < N; i++) {
      var b = document.createElement("i");
      var t = i / N;
      var x, y;
      if (t < 0.35) { x = t / 0.35 * 100; y = 0; }                    // top
      else if (t < 0.5) { x = 100; y = (t - 0.35) / 0.15 * 100; }    // right
      else if (t < 0.85) { x = 100 - (t - 0.5) / 0.35 * 100; y = 100; } // bottom
      else { x = 0; y = 100 - (t - 0.85) / 0.15 * 100; }             // left
      b.style.left = "calc(" + x + "% - 4px)";
      b.style.top = "calc(" + y + "% - 4px)";
      box.appendChild(b);
    }
  })();

  /* ---------- film grain ---------- */
  var gCtx = grain.getContext("2d"), grainTimer = 0;
  var reducedMotion = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  function drawGrain() {
    var img = gCtx.createImageData(160, 120), d = img.data;
    for (var i = 0; i < d.length; i += 4) {
      var v = (Math.random() * 255) | 0;
      d[i] = d[i + 1] = d[i + 2] = v; d[i + 3] = 255;
    }
    gCtx.putImageData(img, 0, 0);
  }
  function grainOn() {
    grain.classList.add("on");
    if (!grainTimer && !reducedMotion) grainTimer = setInterval(drawGrain, 140);
  }
  function grainOff() {
    grain.classList.remove("on");
    if (grainTimer) { clearInterval(grainTimer); grainTimer = 0; }
  }

  /* ---------- chooser ---------- */
  function renderChooser() {
    filmGrid.innerHTML = "";
    films.forEach(function (f) {
      var btn = document.createElement("button");
      btn.className = "film-btn";
      btn.innerHTML = '<p class="t"></p><span class="y"></span>';
      btn.querySelector(".t").textContent = f.title;
      btn.querySelector(".y").textContent = f.year;
      btn.setAttribute("aria-label", "Watch " + f.title + " (" + f.year + ")");
      btn.addEventListener("click", function () { playFilm(f, btn); });
      f._btn = btn;
      filmGrid.appendChild(btn);
    });
  }

  /* ---------- playback ---------- */
  function playFilm(f, btn) {
    curFilm = f;
    // marquee billing
    kicker.textContent = "Now Showing";
    filmTitle.textContent = f.title;
    filmYear.textContent = f.year;
    filmNote.textContent = f.note;
    // highlight
    films.forEach(function (x) { if (x._btn) x._btn.classList.remove("active"); });
    if (btn) btn.classList.add("active");
    // curtains part
    idleMsg.classList.add("hidden");
    screenWrap.classList.add("open");
    document.body.classList.add("watching");
    grainOn();
    // roll film
    player.src = f.url;
    player.classList.add("on");
    try {
      var pr = player.play();
      if (pr && pr.catch) pr.catch(function () {});
    } catch (e) {}
    // scroll the screen into view on small screens
    try { screenWrap.scrollIntoView({ behavior: "smooth", block: "center" }); } catch (e) {}
  }

  function closeHouse() {
    // film over: curtains close, house lights up
    screenWrap.classList.remove("open");
    document.body.classList.remove("watching");
    grainOff();
    player.pause();
    player.classList.remove("on");
    player.removeAttribute("src");
    try { player.load(); } catch (e) {}
    setTimeout(function () {
      kicker.textContent = "Intermission";
      filmTitle.textContent = "Choose a film below";
      filmYear.textContent = "";
      filmNote.textContent = "Thirteen films, all with Black casts, all made outside the Hollywood system. Pick one and step back in time.";
      idleMsg.classList.remove("hidden");
      films.forEach(function (x) { if (x._btn) x._btn.classList.remove("active"); });
      curFilm = null;
    }, 900);
  }

  player.addEventListener("ended", closeHouse);
  player.addEventListener("error", function () {
    if (player.getAttribute("src")) {
      filmNote.textContent = "This reel wouldn't thread. Try another film.";
    }
  });

  // tap the screen to pause / resume
  screenWrap.addEventListener("click", function () {
    if (!curFilm) return;
    if (player.paused) { try { player.play(); } catch (e) {} }
    else player.pause();
  });

  /* ---------- load the program ---------- */
  fetch("films.json")
    .then(function (r) { if (!r.ok) throw 0; return r.json(); })
    .then(function (d) { films = d.films || []; renderChooser(); })
    .catch(function () { films = []; });

  // test hook
  window.__marquee = {
    get films() { return films; },
    play: function (i) { if (films[i]) playFilm(films[i], films[i]._btn); }
  };
})();
