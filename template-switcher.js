(function(){
  'use strict';

  var VALID = [1,2,3,4,5,6,7,8,9];
  var JS_TEMPLATES = {4:true,5:true,6:true,7:true,8:true,9:true};
  var site = String(window.LP360_TEMPLATE_SITE || 'site');
  var tokenKey = String(window.LP360_TEMPLATE_ADMIN_TOKEN_KEY || '');
  var api = window.APP_CONFIG && (window.APP_CONFIG.EXEC_URL || window.APP_CONFIG.API_URL) || '';
  var cacheKey = 'LP360:TEMPLATE:' + site + ':' + encodeURIComponent(api || location.origin);
  var current = 1;
  var committed = 1;
  var pending = 1;

  function normalize(value){
    var m = String(value == null ? '' : value).match(/(\d+)/);
    var n = m ? Number(m[1]) : 1;
    return VALID.indexOf(n) !== -1 ? n : 1;
  }
  function readCache(){
    try { return normalize(localStorage.getItem(cacheKey) || 'Template1'); }
    catch (_) { return 1; }
  }
  function writeCache(n){
    try { localStorage.setItem(cacheKey, 'Template' + normalize(n)); } catch (_) {}
  }
  function readCheckedAt(){
    try { return Number(localStorage.getItem(cacheKey + ':checkedAt') || 0) || 0; }
    catch (_) { return 0; }
  }
  function markChecked(){
    try { localStorage.setItem(cacheKey + ':checkedAt', String(Date.now())); } catch (_) {}
  }
  function isIndexPage(){
    var p = String(location.pathname || '');
    return /(?:^|\/)(?:index\.html)?$/.test(p);
  }
  function isSwitcherOpen(){
    var modal=document.getElementById('templateSwitcherModal');
    return !!(modal && !modal.hidden);
  }
  function removeNode(selector){
    document.querySelectorAll(selector).forEach(function(el){ el.remove(); });
  }
  function cleanupDecorations(){
    removeNode('.template4-hero-cta,.template4-hero-side');
    removeNode('.template5-hero-badge,.template5-hero-cta,.template5-hero-side,.template5-performance-strip');
    removeNode('.template6-hero-cta,.template6-ocean-mark');
    removeNode('.template7-hero-cta');
    document.documentElement.classList.remove('template8-ready','template9-ready');
    var hero=document.getElementById('home');
    var header=document.querySelector('.site-header');
    var overlay=document.getElementById('websiteHeroOverlay');
    if(hero){
      hero.removeAttribute('data-template8-hero');
      hero.removeAttribute('data-template9-hero');
    }
    if(header){
      header.removeAttribute('data-template8-nav');
      header.removeAttribute('data-template9-nav');
    }
    if(overlay) overlay.removeAttribute('data-template9-ellipse');
  }
  function setBodyClass(n){
    if(!document.body) return;
    VALID.forEach(function(x){ document.body.classList.remove('lp-template'+x); });
    if(n > 1) document.body.classList.add('lp-template'+n);
    document.documentElement.setAttribute('data-lp-template', 'Template'+n);
  }
  function removeThemeAssets(){
    var oldCss=document.getElementById('lpDynamicTemplateCss');
    if(oldCss) oldCss.remove();
    document.querySelectorAll('script[data-lp-template-script]').forEach(function(s){ s.remove(); });
  }
  function loadCss(n){
    if(n===1) return;
    var link=document.createElement('link');
    link.id='lpDynamicTemplateCss';
    link.rel='stylesheet';
    link.href='template'+n+'.css?v=20260924-switcher-ui-2';
    document.head.appendChild(link);
  }
  function loadThemeJs(n){
    if(!JS_TEMPLATES[n] || !isIndexPage()) return;
    var script=document.createElement('script');
    script.src='template'+n+'.js?v=20260924-switcher-ui-2';
    script.setAttribute('data-lp-template-script','Template'+n);
    (document.body || document.head).appendChild(script);
  }
  function applyTemplate(value, options){
    var n=normalize(value);
    options=options||{};
    current=n;
    cleanupDecorations();
    removeThemeAssets();
    loadCss(n);
    if(document.body){
      setBodyClass(n);
      loadThemeJs(n);
    }else{
      document.addEventListener('DOMContentLoaded',function(){
        setBodyClass(n);
        loadThemeJs(n);
      },{once:true});
    }
    if(options.cache===true) writeCache(n);
    refreshChoices();
    window.dispatchEvent(new CustomEvent('lp360:templatechange',{detail:{template:'Template'+n,number:n,preview:options.preview===true}}));
    return n;
  }
  function refreshChoices(){
    document.querySelectorAll('#templateSwitcherModal .template-choice').forEach(function(btn){
      var n=normalize(btn.getAttribute('data-template'));
      btn.classList.toggle('is-active',n===current);
      btn.setAttribute('aria-pressed',n===current?'true':'false');
    });
    var currentLabel=document.getElementById('templateSwitcherCurrent');
    if(currentLabel) currentLabel.textContent='Template'+committed;
    var saveBtn=document.getElementById('templateSwitcherSave');
    if(saveBtn) saveBtn.disabled=(pending===committed);
  }
  function parseServerResult(result){
    if(!result || result.success===false) throw new Error(result && result.message || 'โหลด Template ไม่สำเร็จ');
    return normalize((result.data && result.data.template) || result.template || 'Template1');
  }
  async function fetchServerTemplate(){
    if(!api) return committed;
    var sep=api.indexOf('?')===-1?'?':'&';
    var response=await fetch(api+sep+'mode=templatesetting&_ts='+Date.now(),{cache:'no-store'});
    if(!response.ok) throw new Error('HTTP '+response.status);
    var result=await response.json();
    var n=parseServerResult(result);
    committed=n;
    writeCache(n);
    if(!isSwitcherOpen()){
      pending=n;
      applyTemplate(n,{cache:false});
    }else{
      refreshChoices();
    }
    markChecked();
    return n;
  }
  async function saveServerTemplate(n){
    if(!api) throw new Error('ไม่พบ URL ของ Apps Script');
    var token='';
    try { token=sessionStorage.getItem(tokenKey)||''; } catch (_) {}
    if(!token) throw new Error('กรุณาเข้าสู่ระบบผู้ดูแลอีกครั้ง');
    var response=await fetch(api,{
      method:'POST',cache:'no-store',
      headers:{'Content-Type':'text/plain;charset=utf-8'},
      body:JSON.stringify({mode:'templatesettingadmin',token:token,template:'Template'+n})
    });
    if(!response.ok) throw new Error('HTTP '+response.status);
    var result=await response.json();
    if(!result || result.success===false) throw new Error(result && result.message || 'บันทึก Template ไม่สำเร็จ');
    return normalize((result.data && result.data.template) || 'Template'+n);
  }

  committed=readCache();
  pending=committed;
  current=committed;
  applyTemplate(committed,{cache:false});

  function scheduleRefresh(){
    var age=Date.now()-readCheckedAt();
    if(age>=0 && age<60000) return;
    var run=function(){ fetchServerTemplate().catch(function(err){ console.warn('template setting:',err); }); };
    if(readCheckedAt()===0){
      run();
    }else if('requestIdleCallback' in window){
      requestIdleCallback(run,{timeout:1800});
    }else{
      setTimeout(run,500);
    }
  }
  if(document.readyState==='complete') scheduleRefresh();
  else window.addEventListener('load',scheduleRefresh,{once:true});

  function setupAdminUi(){
    var modal=document.getElementById('templateSwitcherModal');
    var openBtn=document.getElementById('templateSwitcherButton');
    if(!modal || !openBtn) return;
    var grid=modal.querySelector('.template-switcher-grid');
    var closeBtn=modal.querySelector('.template-switcher-close');
    var cancelBtn=document.getElementById('templateSwitcherCancel');
    var saveBtn=document.getElementById('templateSwitcherSave');
    var status=modal.querySelector('.template-switcher-status');
    if(!grid || !closeBtn || !cancelBtn || !saveBtn || !status) return;

    grid.innerHTML='';
    VALID.forEach(function(n){
      var b=document.createElement('button');
      b.type='button';
      b.className='template-choice';
      b.setAttribute('data-template',String(n));
      b.setAttribute('aria-label','ดูตัวอย่าง Template'+n);
      b.innerHTML='<strong>Template'+n+'</strong>';
      b.addEventListener('click',function(){
        pending=n;
        applyTemplate(n,{cache:false,preview:true});
        status.className='template-switcher-status is-preview';
        status.textContent='กำลังดูตัวอย่าง Template'+n+' — ยังไม่ได้บันทึก';
        refreshChoices();
      });
      grid.appendChild(b);
    });

    function openSwitcher(){
      pending=committed;
      if(current!==committed) applyTemplate(committed,{cache:false});
      refreshChoices();
      status.className='template-switcher-status';
      status.textContent='เลือก Template เพื่อดูตัวอย่าง แล้วกด “บันทึก Template”';
      modal.hidden=false;
      modal.setAttribute('aria-hidden','false');
      openBtn.hidden=true;
    }
    function closeWithoutSave(){
      pending=committed;
      applyTemplate(committed,{cache:true});
      modal.hidden=true;
      modal.setAttribute('aria-hidden','true');
      openBtn.hidden=false;
    }
    function closeAfterSave(){
      modal.hidden=true;
      modal.setAttribute('aria-hidden','true');
      openBtn.hidden=false;
    }

    openBtn.addEventListener('click',openSwitcher);
    closeBtn.addEventListener('click',closeWithoutSave);
    cancelBtn.addEventListener('click',closeWithoutSave);
    document.addEventListener('keydown',function(e){
      if(e.key==='Escape' && !modal.hidden) closeWithoutSave();
    });

    saveBtn.addEventListener('click',async function(){
      var chosen=pending;
      if(chosen===committed){
        status.className='template-switcher-status is-success';
        status.textContent='Template'+committed+' เป็น Template ที่บันทึกอยู่แล้ว';
        setTimeout(closeAfterSave,250);
        return;
      }
      status.className='template-switcher-status';
      status.textContent='กำลังบันทึก Template'+chosen+'...';
      saveBtn.disabled=true;
      cancelBtn.disabled=true;
      closeBtn.disabled=true;
      grid.querySelectorAll('button').forEach(function(x){x.disabled=true;});
      try{
        var saved=await saveServerTemplate(chosen);
        committed=saved;
        pending=saved;
        applyTemplate(saved,{cache:true});
        markChecked();
        status.className='template-switcher-status is-success';
        status.textContent='บันทึก Template'+saved+' แล้ว';
        setTimeout(closeAfterSave,350);
      }catch(err){
        pending=committed;
        applyTemplate(committed,{cache:true});
        status.className='template-switcher-status is-error';
        status.textContent='บันทึกไม่สำเร็จ: '+err.message+' — กลับไปใช้ Template'+committed;
      }finally{
        cancelBtn.disabled=false;
        closeBtn.disabled=false;
        grid.querySelectorAll('button').forEach(function(x){x.disabled=false;});
        refreshChoices();
      }
    });

    refreshChoices();
  }
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',setupAdminUi,{once:true});
  else setupAdminUi();

  window.LP360TemplateSwitcher={
    getCurrent:function(){return 'Template'+current;},
    getSaved:function(){return 'Template'+committed;},
    apply:function(n){
      var value=normalize(n);
      committed=value;
      pending=value;
      return applyTemplate(value,{cache:true});
    },
    refresh:fetchServerTemplate
  };
})();
