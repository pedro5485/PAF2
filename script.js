(function () {
  const CURRENT_USER_KEY = "drivesafe_current_user";
  const LESSONS_KEY = "drivesafe_marked_lessons";
  const BOOKING_EMAIL = "mariopimenta101@gmail.com";
  const DEMO_USERNAME = "admin";
  const DEMO_PASSWORD = "123456";

  const modalTemplate = `
  <div id="modal" class="modal">
    <div class="box">
      <span onclick="fecharModal()" class="close">&times;</span>
      <div id="loginBox">
        <h2>Entrar</h2>
        <input id="loginUser" placeholder="Utilizador">
        <input id="loginPass" type="password" placeholder="Palavra-passe">
        <button onclick="login()">Entrar</button>
      </div>
      <p id="msg"></p>
    </div>
  </div>`;

  function byId(id) {
    return document.getElementById(id);
  }

  function getCurrentUser() {
    return sessionStorage.getItem(CURRENT_USER_KEY) || "";
  }

  function setCurrentUser(username) {
    sessionStorage.setItem(CURRENT_USER_KEY, username);
  }

  function showMessage(text) {
    const msg = byId("msg");
    if (msg) {
      msg.textContent = text;
    }
  }

  function ensureModal() {
    if (!byId("modal")) {
      document.body.insertAdjacentHTML("beforeend", modalTemplate);
    }
    return byId("modal");
  }

  function setupActiveNav() {
    const currentPage = window.location.pathname.split("/").pop() || "index.html";

    document.querySelectorAll("nav a").forEach(function (link) {
      if (link.getAttribute("href") === currentPage) {
        link.classList.add("active");
      }
    });
  }

  function getLessonStorageKey() {
    return LESSONS_KEY + "_" + (getCurrentUser() || "aluno");
  }

  function getMarkedLessons() {
    try {
      return JSON.parse(localStorage.getItem(getLessonStorageKey())) || [];
    } catch (error) {
      return [];
    }
  }

  function saveMarkedLessons(lessons) {
    localStorage.setItem(getLessonStorageKey(), JSON.stringify(lessons));
  }

  function updateLessonSectionVisibility() {
    const lessonSection = document.querySelector(".marcacao-aulas");
    if (lessonSection) {
      lessonSection.style.display = getCurrentUser() ? "block" : "none";
    }
  }

  function updateAuthButtons() {
    const currentUser = getCurrentUser();

    document.querySelectorAll(".auth-btn").forEach(function (button) {
      button.textContent = currentUser ? "Olá, " + currentUser : "Entrar";
      button.title = currentUser ? "Clique para terminar sessão" : "";
    });

    updateLessonSectionVisibility();
  }

  function updateLessonsList() {
    const list = byId("myLessonsList");
    if (!list) {
      return;
    }

    const labels = {};
    document.querySelectorAll(".lesson-card").forEach(function (card) {
      labels[card.dataset.lessonId] = card.dataset.lessonLabel;
    });

    const lessons = getMarkedLessons();
    list.innerHTML = "";

    if (!lessons.length) {
      list.innerHTML = "<li>Ainda não tens aulas marcadas.</li>";
      return;
    }

    lessons.forEach(function (lessonId) {
      const item = document.createElement("li");
      item.textContent = labels[lessonId] || lessonId;
      list.appendChild(item);
    });
  }

  function refreshLessonCards() {
    updateLessonSectionVisibility();

    const markedLessons = getMarkedLessons();
    const lessonMsg = byId("lessonMsg");

    document.querySelectorAll(".lesson-card").forEach(function (card) {
      const lessonId = card.dataset.lessonId;
      const button = card.querySelector(".lesson-toggle");
      const isBooked = markedLessons.includes(lessonId);

      card.classList.toggle("is-booked", isBooked);

      if (button) {
        button.textContent = isBooked ? "Desmarcar aula" : "Marcar aula";
      }
    });

    if (lessonMsg) {
      lessonMsg.textContent = "Escolhe uma aula disponível para marcar ou desmarcar.";
    }

    updateLessonsList();
  }

  function setupBookingForm() {
    const form = byId("bookingForm");
    const msg = byId("bookingMsg");

    if (!form || !msg) {
      return;
    }

    const cursoUrl = new URLSearchParams(window.location.search).get("curso");
    if (cursoUrl && byId("bookingCourse")) {
      byId("bookingCourse").value = cursoUrl;
    }

    form.addEventListener("submit", function (event) {
      event.preventDefault();

      const nome = byId("bookingName").value.trim();
      const email = byId("bookingEmail").value.trim();
      const telefone = byId("bookingPhone").value.trim();
      const curso = byId("bookingCourse").value;
      const data = byId("bookingDate").value;
      const observacoes = byId("bookingNotes").value.trim();

      if (!nome || !email || !telefone || !curso || !data) {
        msg.textContent = "Preenche os campos obrigatórios.";
        return;
      }

      const subject = "Nova inscrição DriveSafe - " + nome;
      const body = [
        "Nova inscrição recebida:",
        "",
        "Nome: " + nome,
        "Email: " + email,
        "Telefone: " + telefone,
        "Curso: " + curso,
        "Data pretendida: " + data,
        "Observações: " + (observacoes || "Sem observações")
      ].join("\n");

      window.location.href = "mailto:" + BOOKING_EMAIL + "?subject=" + encodeURIComponent(subject) + "&body=" + encodeURIComponent(body);
      msg.textContent = "Vai abrir o teu email para enviares a inscrição.";
    });
  }

  function setupLessonBooking() {
    document.querySelectorAll(".lesson-card").forEach(function (card) {
      const button = card.querySelector(".lesson-toggle");
      if (!button) {
        return;
      }

      button.addEventListener("click", function () {
        if (!getCurrentUser()) {
          return;
        }

        const lessonId = card.dataset.lessonId;
        const lessonLabel = card.dataset.lessonLabel;
        const lessons = getMarkedLessons();
        const index = lessons.indexOf(lessonId);

        if (index >= 0) {
          lessons.splice(index, 1);
        } else {
          lessons.push(lessonId);
        }

        saveMarkedLessons(lessons);
        refreshLessonCards();

        const lessonMsg = byId("lessonMsg");
        if (lessonMsg) {
          lessonMsg.textContent = index >= 0 ? "Aula desmarcada: " + lessonLabel + "." : "Aula marcada: " + lessonLabel + ".";
        }
      });
    });
  }

  window.abrirModal = function abrirModal() {
    if (getCurrentUser()) {
      sessionStorage.removeItem(CURRENT_USER_KEY);
      updateAuthButtons();
      refreshLessonCards();
      return;
    }

    ensureModal().style.display = "block";
    showMessage("");
  };

  window.fecharModal = function fecharModal() {
    const modal = byId("modal");
    if (modal) {
      modal.style.display = "none";
    }
  };

  window.login = function login() {
    const username = byId("loginUser").value.trim();
    const password = byId("loginPass").value.trim();

    if (username !== DEMO_USERNAME || password !== DEMO_PASSWORD) {
      showMessage("Dados incorretos.");
      return;
    }

    setCurrentUser(username);
    updateAuthButtons();
    refreshLessonCards();
    window.fecharModal();
  };

  window.addEventListener("click", function (event) {
    if (event.target === byId("modal")) {
      window.fecharModal();
    }
  });

  document.addEventListener("DOMContentLoaded", function () {
    ensureModal();
    setupActiveNav();
    setupBookingForm();
    setupLessonBooking();
    updateAuthButtons();
    refreshLessonCards();
  });
})();
