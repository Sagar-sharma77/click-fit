/* =========================================================
   ClickFit — main.js
   ========================================================= */

$(function () {
  // ---------- 1. Navbar shrinks/darkens after scroll ----------
  $(window).on('scroll', function () {
    $('.navbar').toggleClass('scrolled', $(window).scrollTop() > 50);
  });

  // ---------- 2. Scroll-reveal animation ----------
  // Any element with class .reveal fades/slides in when it enters view.
  const revealTargets = document.querySelectorAll(
    '.section-heading, .program-card, .drop-zone, .api-card'
  );
  revealTargets.forEach(el => el.classList.add('reveal'));

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          observer.unobserve(entry.target);   // animate once
        }
      });
    },
    { threshold: 0.15 }
  );
  revealTargets.forEach(el => observer.observe(el));
});

// ---------- 3. AJAX call to the REST API ----------
  const API_URL = 'https://api.restful-api.dev/objects';

  // Show a loading state immediately
  const $apiResults = $('#api-results');
  $apiResults.html(`
    <div class="col-12 text-center text-muted py-4">
      <div class="spinner-border text-warning" role="status"></div>
      <p class="mt-2 mb-0">Fetching live data…</p>
    </div>
  `);

  $.ajax({
    url: API_URL,
    method: 'GET',
    dataType: 'json',
    timeout: 10000
  })
    .done(function (data) {
      // `data` is an array of objects from the API
      console.log('API response:', data);

      if (!Array.isArray(data) || data.length === 0) {
        $apiResults.html(`<div class="col-12 text-center text-muted">No data returned.</div>`);
        return;
      }

      // Show only the first 8 items so the page doesn't get huge
      const items = data.slice(0, 8);

      const cardsHtml = items.map(item => {
        // The API returns { id, name, data: {...} | null }
        const details = item.data
          ? Object.entries(item.data)
              .map(([k, v]) => `<li><strong>${k}:</strong> ${v}</li>`)
              .join('')
          : '<li class="text-muted">No details</li>';

        return `
          <div class="col-sm-6 col-md-4 col-lg-3">
            <div class="card api-card h-100 shadow-sm">
              <div class="card-body">
                <h6 class="card-title text-truncate" title="${item.name}">
                  ${item.name}
                </h6>
                <p class="small text-muted mb-2">ID: ${item.id}</p>
                <ul class="list-unstyled small mb-0">${details}</ul>
              </div>
            </div>
          </div>
        `;
      }).join('');

      $apiResults.html(cardsHtml);

      // Re-run the reveal animation on the freshly added cards
      $apiResults.find('.api-card').each(function (i) {
        const el = this;
        el.classList.add('reveal');
        setTimeout(() => el.classList.add('visible'), i * 80);
      });

      // Small "info area" showing when/where the data came from
      $('#api-meta').html(
        `Loaded <strong>${items.length}</strong> of <strong>${data.length}</strong> records from
         <code>${API_URL}</code> at <strong>${new Date().toLocaleTimeString()}</strong>.`
      );
    })
    .fail(function (jqXHR, textStatus, errorThrown) {
      console.error('AJAX failed:', textStatus, errorThrown);
      $apiResults.html(`
        <div class="col-12">
          <div class="alert alert-danger text-center mb-0">
            Could not load data (${textStatus}). Please try again later.
          </div>
        </div>
      `);
    })
    .always(function () {
      // Runs whether success or fail — could hide a global spinner here
      console.log('AJAX request finished.');
    });


      // ---------- 4. Drag & drop image upload ----------
  const $dropZone     = $('#drop-zone');
  const $fileInput    = $('#file-input');
  const $uploadStatus = $('#upload-status');
  const $preview      = $('#upload-preview');

  // Allowed types + max size per file (5 MB)
  const ALLOWED = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
  const MAX_MB  = 5;

  // --- Helper: validate a File, returns an error string or null ---
  function validateFile(file) {
    if (!ALLOWED.includes(file.type)) return `"${file.name}" is not an allowed image type.`;
    if (file.size > MAX_MB * 1024 * 1024) return `"${file.name}" is larger than ${MAX_MB} MB.`;
    return null;
  }

  // --- Helper: show a status message ---
  function setStatus(html, type = 'info') {
    // type: info | success | danger
    const cls = type === 'success' ? 'text-success'
              : type === 'danger'  ? 'text-danger'
              : 'text-muted';
    $uploadStatus.html(`<p class="${cls} mb-0">${html}</p>`);
  }

  // --- Click on the drop zone opens the file picker ---
        $dropZone.on('click', function (e) {
        
        document.getElementById('file-input').click();
    });
  $dropZone.on('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      $fileInput.trigger('click');
    }
  });

  // --- File input change ---
  $fileInput.on('change', function () {
    handleFiles(this.files);
    $(this).val('');   // allow re-selecting the same file
  });

  // --- Drag events ---
  // Prevent the browser's default "open the file" behaviour
  ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(evt => {
    $dropZone.on(evt, e => { e.preventDefault(); e.stopPropagation(); });
  });

  $dropZone
    .on('dragenter dragover', () => $dropZone.addClass('dragover'))
    .on('dragleave drop',    () => $dropZone.removeClass('dragover'));

  $dropZone.on('drop', function (e) {
    const files = e.originalEvent.dataTransfer.files;
    handleFiles(files);
  });

  // --- Main upload handler ---
  function handleFiles(fileList) {
    if (!fileList || fileList.length === 0) return;

    const files = Array.from(fileList);
    let okCount = 0;

    files.forEach(file => {
      const err = validateFile(file);
      if (err) {
        setStatus(err, 'danger');
        return;
      }
      okCount++;
      previewFile(file);   // show thumbnail immediately
      uploadFile(file);    // fire the request
    });

    if (okCount > 0) {
      setStatus(`Uploading ${okCount} file${okCount > 1 ? 's' : ''}…`, 'info');
    }
  }

  // --- Show a local preview (before/while uploading) ---
  function previewFile(file) {
    const reader = new FileReader();
    reader.onload = (e) => {
      const $col = $(`
        <div class="col-auto text-center">
          <img src="${e.target.result}" class="preview-thumb" alt="${file.name}" />
          <div class="small text-muted text-truncate mt-1" style="max-width:140px"
               title="${file.name}">${file.name}</div>
        </div>
      `);
      $preview.prepend($col);
    };
    reader.readAsDataURL(file);
  }

  // --- Send one file to the backend ---
  function uploadFile(file) {
    const fd = new FormData();
    fd.append('image', file);   // field name must match backend's multer.single('image')

    $.ajax({
      url: 'http://localhost:3000/upload',
      method: 'POST',
      data: fd,
      processData: false,   // IMPORTANT: don't let jQuery serialise the FormData
      contentType: false,   // IMPORTANT: let the browser set the multipart boundary
      dataType: 'json'
    })
      .done(res => {
        setStatus(`✅ Uploaded <strong>${file.name}</strong> → <code>${res.path}</code>`, 'success');
        console.log('Upload OK:', res);
      })
      .fail((xhr) => {
        const msg = (xhr.responseJSON && xhr.responseJSON.error) || xhr.statusText || 'Upload failed';
        setStatus(`❌ ${file.name}: ${msg}`, 'danger');
        console.error('Upload failed:', xhr);
      });
  }