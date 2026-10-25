// 등장 효과: 섹션이 보이면 제목 → 글 → 사진 순으로 차례로 나타난다
(() => {
  const groups = new Map();
  document.querySelectorAll('.reveal').forEach((el) => {
    const host = el.closest('section, header') || document.body;
    const n = groups.get(host) || 0;
    el.style.setProperty('--i', n);
    groups.set(host, n + 1);
  });
  if (!('IntersectionObserver' in window)) {
    document.querySelectorAll('.reveal').forEach((el) => el.classList.add('in'));
    return;
  }
  const io = new IntersectionObserver((entries) => {
    entries.forEach((e) => {
      if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); }
    });
  }, { rootMargin: '0px 0px -8% 0px' });
  document.querySelectorAll('.reveal').forEach((el) => io.observe(el));
})();

// 수량 고르기: 고른 만큼 합계를 보여 주고, 주문 문의 칸에 그대로 넣는다
(() => {
  const won = (n) => n.toLocaleString('ko-KR') + '원';
  const tags = [...document.querySelectorAll('.tag')];
  const qty = new Map(tags.map((t) => [t, 0]));
  const lines = document.getElementById('tally-lines');
  const sum = document.getElementById('tally-sum');
  const message = document.getElementById('f-message');
  let lastAuto = '';

  const summary = () => tags
    .filter((t) => qty.get(t) > 0)
    .map((t) => `${t.dataset.item} ${qty.get(t)}${t.dataset.unit}`);

  const render = () => {
    const picked = summary();
    const total = tags.reduce((s, t) => s + qty.get(t) * Number(t.dataset.price), 0);
    lines.textContent = picked.length ? picked.join(', ') : '아직 고른 것이 없어요.';
    sum.textContent = won(total);
    // 손님이 직접 고쳐 쓴 글은 덮어쓰지 않는다
    if (message.value === '' || message.value === lastAuto) {
      lastAuto = picked.length ? `${picked.join(', ')} 주문하고 싶어요. (합계 ${won(total)})` : '';
      message.value = lastAuto;
    }
  };

  tags.forEach((t) => {
    const out = t.querySelector('.qty');
    t.querySelectorAll('.step').forEach((b) => {
      b.addEventListener('click', () => {
        const next = Math.max(0, Math.min(99, qty.get(t) + Number(b.dataset.d)));
        qty.set(t, next);
        out.textContent = next + t.dataset.unit;
        out.classList.remove('bump'); void out.offsetWidth; out.classList.add('bump');
        render();
      });
    });
  });
})();

// 주문 문의 보내기: /api/inquiry 에 저장
(() => {
  const form = document.getElementById('order-form');
  const msg = document.getElementById('form-msg');
  const btn = form.querySelector('button[type=submit]');

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    msg.className = 'form-msg';
    const name = form.elements.name.value.trim();
    const contact = form.elements.contact.value.trim();
    const consent = document.getElementById('f-consent').checked;
    if (!name || !contact) { msg.textContent = '이름과 연락처를 적어 주세요.'; msg.classList.add('err'); return; }
    if (!consent) { msg.textContent = '개인정보 수집·이용에 동의해 주세요.'; msg.classList.add('err'); return; }

    btn.disabled = true; btn.textContent = '보내는 중…';
    try {
      const r = await fetch('/api/inquiry', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, contact, message: form.elements.message.value.trim(), consent, website: form.elements.website.value }),
      });
      const data = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(data.error || '보내지 못했어요. 잠시 뒤 다시 시도해 주세요.');
      form.reset();
      msg.textContent = '문의가 접수됐어요. 확인 후 연락드릴게요.';
      msg.classList.add('ok');
    } catch (err) {
      msg.textContent = err.message || '보내지 못했어요. 전화로 문의해 주세요.';
      msg.classList.add('err');
    } finally {
      btn.disabled = false; btn.textContent = '주문 문의 보내기';
    }
  });
})();
