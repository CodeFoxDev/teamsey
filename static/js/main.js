const switches = {
  setState: {
    off: () => {
      switches.side.checked = false;
      switches.msgSide.checked = false;
      switches.accSide.checked = false;
    },
    addListener: () => {
      switches.side.addEventListener('change', () => {
        switches.msgSide.checked = false;
        switches.accSide.checked = false;
      });
      switches.msgSide.addEventListener('change', () => {
        switches.side.checked = false;
        switches.accSide.checked = false;
      });
      switches.accSide.addEventListener('change', () => {
        switches.side.checked = false;
        switches.msgSide.checked = false;
      });
      document.querySelector('main').addEventListener('click', () => {
        switches.setState.off();
        switches.loginOverlay.checked = false;
        if(window.location.hash == "#login"){ window.location.hash = ""; }
        if(document.getElementById('projects-side-switch')){ document.getElementById('projects-side-switch').checked = false; }
      });
    }
  },
  side: document.querySelector('#sidebar-switch'),
  msgSide: document.querySelector('#msg-sidebar-switch'),
  accSide: document.querySelector('#acc-sidebar-switch'),
  loginOverlay: document.querySelector('#login-overlay-switch')
}
const titleElements = {
  scrollFromOffset: 120,
  title: document.querySelector('#title'),
  underTitle: document.querySelector('#underTitle'),
  titleButtons: document.querySelector('#titleButtons'),

  gradient: {
    on: () => {
      document.documentElement.style.setProperty('--front-gradient', 'linear-gradient(90deg, var(--blue-light), var(--purple-dark))');
    },
    off: () => {
      document.documentElement.style.setProperty('--front-gradient', 'var(--text-color)');
    },
  }
}

switches.setState.addListener();
//# onload
if(window.location.href.includes("/login")){ switches.loginOverlay.checked = true; }
//# onhashchange
window.onhashchange = () => { if(window.location.hash == "#login"){ switches.loginOverlay.checked = true; } }