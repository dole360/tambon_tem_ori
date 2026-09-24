/* Template5 visual helper. Decorative only; existing data loading, login,
   admin CRUD, navigation, APIs and Google Sheet behaviour are untouched. */
(function () {
  'use strict';

  function bootTemplate5() {
    var hero = document.getElementById('home');
    var content = hero && hero.querySelector('.hero-content');
    if (!hero || !content) return;

    if (!content.querySelector('.template5-hero-badge')) {
      var badge = document.createElement('span');
      badge.className = 'template5-hero-badge';
      badge.textContent = 'LEARNING PLATFORM 360';
      content.insertBefore(badge, content.firstChild);
    }

    if (!content.querySelector('.template5-hero-cta')) {
      var cta = document.createElement('a');
      cta.className = 'template5-hero-cta';
      cta.href = '#learningSourceBox';
      cta.textContent = 'EXPLORE NOW';
      content.appendChild(cta);
    }

    if (!hero.querySelector('.template5-hero-side.is-left')) {
      var left = document.createElement('span');
      left.className = 'template5-hero-side is-left';
      left.setAttribute('aria-hidden', 'true');
      left.textContent = '‹';
      hero.appendChild(left);
    }

    if (!hero.querySelector('.template5-hero-side.is-right')) {
      var right = document.createElement('span');
      right.className = 'template5-hero-side is-right';
      right.setAttribute('aria-hidden', 'true');
      right.textContent = '›';
      hero.appendChild(right);
    }

    if (!document.querySelector('.template5-performance-strip')) {
      var strip = document.createElement('div');
      strip.className = 'template5-performance-strip';
      strip.setAttribute('aria-hidden', 'true');
      strip.innerHTML = '<div class="template5-performance-strip-inner">' +
        '<span>LEARNING</span><span>DIGITAL</span><span>ACTIVITY</span>' +
        '<span>KNOWLEDGE</span><span>COMMUNITY</span></div>';
      hero.insertAdjacentElement('afterend', strip);
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', bootTemplate5, { once: true });
  } else {
    bootTemplate5();
  }
})();
