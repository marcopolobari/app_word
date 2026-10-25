/* Office Web PWA - registrazione service worker e installazione */
(function () {
  'use strict';

  var isStandalone =
    window.matchMedia('(display-mode: standalone)').matches ||
    window.navigator.standalone === true;

  if ('serviceWorker' in navigator && /^https?:$/.test(location.protocol)) {
    var hadController = !!navigator.serviceWorker.controller;
    var refreshing = false;

    navigator.serviceWorker
      .register('sw.js', { scope: './' })
      .catch(function (err) {
        console.warn('Service worker non registrato:', err);
      });

    navigator.serviceWorker.addEventListener('controllerchange', function () {
      if (!hadController || refreshing) return;
      refreshing = true;
      location.reload();
    });
  }

  var deferredPrompt = null;

  function installButton() {
    return document.querySelector('.pwa-install');
  }

  function showInstallButton() {
    if (isStandalone || installButton()) return;
    var actions = document.querySelector('.titlebar-actions');
    if (!actions) return;

    var btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'tb-btn pwa-install';
    btn.textContent = 'Installa app';
    btn.title = 'Installa Office Web sullo smartphone o sul computer';
    btn.addEventListener('click', function () {
      if (!deferredPrompt) return;
      var prompt = deferredPrompt;
      deferredPrompt = null;
      btn.disabled = true;
      prompt.prompt();
      prompt.userChoice
        .then(function (choice) {
          if (choice && choice.outcome === 'accepted') {
            btn.remove();
          } else {
            btn.disabled = false;
          }
        })
        .catch(function () {
          btn.disabled = false;
        });
    });

    actions.insertBefore(btn, actions.firstChild);
  }

  window.addEventListener('beforeinstallprompt', function (event) {
    event.preventDefault();
    deferredPrompt = event;
    showInstallButton();
  });

  window.addEventListener('appinstalled', function () {
    deferredPrompt = null;
    var btn = installButton();
    if (btn) btn.remove();
  });

  if (isStandalone) {
    document.documentElement.classList.add('pwa-standalone');
  }

  /* Apre direttamente Excel quando si usa il collegamento rapido ?app=excel */
  try {
    var app = new URLSearchParams(location.search).get('app');
    if (app === 'excel' || app === 'word') {
      var target = document.querySelector('.app-btn[data-goto="' + app + '"]');
      if (target) {
        setTimeout(function () {
          target.click();
        }, 0);
      }
    }
  } catch (err) {
    /* URLSearchParams non disponibile: nessun problema */
  }
})();
