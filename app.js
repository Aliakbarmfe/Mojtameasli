// ==========================================
// CONFIGURATION & GLOBAL STATES
// ==========================================
const API_FIREBASE = '/api/firebase';
const API_IMGBB = '/api/imgbb';

let currentUser = JSON.parse(localStorage.getItem('user')) || null;
let isAdminLoggedIn = sessionStorage.getItem('adminLoggedIn') === 'true';

// ==========================================
// CUSTOM POPUP SYSTEM (NO NATIVE ALERTS)
// ==========================================
function showCustomAlert(title, message, callback = null) {
    const overlay = document.createElement('div');
    overlay.className = 'popup-overlay active';
    overlay.style.zIndex = '99999';

    overlay.innerHTML = `
        <div class="popup-content">
            <div class="popup-header">
                <span class="popup-title">${title}</span>
                <button class="close-btn">&times;</button>
            </div>
            <div style="font-size: 14px; line-height: 1.6; color: #e2e8f0; margin-bottom: 20px;">
                ${message}
            </div>
            <button class="btn btn-primary alert-ok-btn">متوجه شدم</button>
        </div>
    `;

    document.body.appendChild(overlay);

    const closeAlert = () => {
        overlay.classList.remove('active');
        setTimeout(() => {
            overlay.remove();
            if (callback) callback();
        }, 300);
    };

    overlay.querySelector('.close-btn').addEventListener('click', closeAlert);
    overlay.querySelector('.alert-ok-btn').addEventListener('click', closeAlert);
}

function showCustomConfirm(title, message, onConfirm) {
    const overlay = document.createElement('div');
    overlay.className = 'popup-overlay active';
    overlay.style.zIndex = '99999';

    overlay.innerHTML = `
        <div class="popup-content">
            <div class="popup-header">
                <span class="popup-title">${title}</span>
            </div>
            <div style="font-size: 14px; line-height: 1.6; color: #e2e8f0; margin-bottom: 20px;">
                ${message}
            </div>
            <div style="display: flex; gap: 10px;">
                <button class="btn btn-danger confirm-yes-btn">بله</button>
                <button class="btn btn-secondary confirm-no-btn">انصراف</button>
            </div>
        </div>
    `;

    document.body.appendChild(overlay);

    const closeConfirm = () => {
        overlay.classList.remove('active');
        setTimeout(() => overlay.remove(), 300);
    };

    overlay.querySelector('.confirm-yes-btn').addEventListener('click', () => {
        closeConfirm();
        onConfirm();
    });

    overlay.querySelector('.confirm-no-btn').addEventListener('click', closeConfirm);
}

// ==========================================
// API HELPER FUNCTIONS
// ==========================================
async function uploadToImgBB(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = async () => {
            try {
                const response = await fetch(API_IMGBB, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ image: reader.result })
                });
                const data = await response.json();
                if (data.url) resolve(data.url);
                else reject(data.error || 'خطا در آپلود عکس');
            } catch (err) {
                reject('خطای شبکه در آپلود عکس');
            }
        };
        reader.onerror = error => reject(error);
    });
}

// تبدیل فرمت Firestore REST به JSON ساده
function parseFirestoreDoc(doc) {
    const id = doc.name.split('/').pop();
    const fields = doc.fields || {};
    const result = { id };
    for (const key in fields) {
        const field = fields[key];
        if (field.stringValue !== undefined) result[key] = field.stringValue;
        else if (field.integerValue !== undefined) result[key] = Number(field.integerValue);
        else if (field.arrayValue !== undefined) {
            result[key] = (field.arrayValue.values || []).map(v => v.stringValue);
        }
    }
    return result;
}

// ساخت payload برای ذخیره در Firestore REST
function buildFirestoreFields(data) {
    const fields = {};
    for (const key in data) {
        const value = data[key];
        if (typeof value === 'string') {
            fields[key] = { stringValue: value };
        } else if (typeof value === 'number') {
            fields[key] = { integerValue: String(value) };
        } else if (Array.isArray(value)) {
            fields[key] = {
                arrayValue: {
                    values: value.map(item => ({ stringValue: item }))
                }
            };
        }
    }
    return { fields };
}

// ==========================================
// UI & AUTH MANAGEMENT
// ==========================================
function updateAuthUI() {
    const userBadgeBtn = document.getElementById('userAuthBtn');
    const drawerLogoutBtn = document.getElementById('drawerLogoutItem');

    if (userBadgeBtn) {
        if (currentUser) {
            userBadgeBtn.innerText = currentUser.name;
            if (drawerLogoutBtn) drawerLogoutBtn.style.display = 'block';
        } else {
            userBadgeBtn.innerText = 'ورود';
            if (drawerLogoutBtn) drawerLogoutBtn.style.display = 'none';
        }
    }
}

// ==========================================
// DRAWER TOGGLE
// ==========================================
function toggleDrawer(open) {
    const drawer = document.getElementById('sideDrawer');
    const overlay = document.getElementById('drawerOverlay');
    if (drawer && overlay) {
        if (open) {
            drawer.classList.add('active');
            overlay.classList.add('active');
        } else {
            drawer.classList.remove('active');
            overlay.classList.remove('active');
        }
    }
}

// ==========================================
// INITIALIZATION
// ==========================================
document.addEventListener('DOMContentLoaded', () => {
    updateAuthUI();

    // کلیک روی ۳ نقطه
    const menuBtn = document.getElementById('menuBtn');
    if (menuBtn) menuBtn.addEventListener('click', () => toggleDrawer(true));

    const drawerOverlay = document.getElementById('drawerOverlay');
    if (drawerOverlay) drawerOverlay.addEventListener('click', () => toggleDrawer(false));

    // پاپ‌آپ ساخت سایت (توی کشو)
    const buildSiteItem = document.getElementById('buildSiteItem');
    if (buildSiteItem) {
        buildSiteItem.addEventListener('click', () => {
            toggleDrawer(false);
            showCustomAlert('ساخت سایت اختصاصی', `
                تو هم میخوای سایت خودت رو داشته باشی؟<br>
                سایت گپ چت، خرید و فروش، اطلاعاتی، بازی های مثل تاس و سنگ و کاغذ و قیچی و.... به آیدی های زیر در روبیکا پیام بده:<br><br>
                <b>@slider_org</b><br>
                <b>@fizon_support</b><br><br>
                <a href="https://Fizon.vercel.app" target="_blank" style="text-decoration:none;">
                    <button class="btn btn-primary" style="margin-top:10px;">سایت ما (کلیک کن تا وارد سایت ما بشی)</button>
                </a>
            `);
        });
    }

    // ورود کاربر از هدر
    const userAuthBtn = document.getElementById('userAuthBtn');
    if (userAuthBtn) {
        userAuthBtn.addEventListener('click', () => {
            if (!currentUser) {
                openAuthChoicePopup();
            }
        });
    }

    // خروج کاربر از کشو
    const drawerLogoutItem = document.getElementById('drawerLogoutItem');
    if (drawerLogoutItem) {
        drawerLogoutItem.addEventListener('click', () => {
            toggleDrawer(false);
            showCustomConfirm('خروج از حساب', 'آیا می‌خواهید از حساب کاربری خود خارج شوید؟', () => {
                localStorage.removeItem('user');
                currentUser = null;
                updateAuthUI();
                showCustomAlert('موفقیت', 'با موفقیت از حساب خود خارج شدید.');
            });
        });
    }

    // پشتیبانی شناور
    const floatingSupportBtn = document.getElementById('floatingSupportBtn');
    if (floatingSupportBtn) {
        floatingSupportBtn.addEventListener('click', () => {
            openSupportPopup();
        });
    }
});

// ==========================================
// AUTH CHOICE POPUP
// ==========================================
function openAuthChoicePopup() {
    const overlay = document.createElement('div');
    overlay.className = 'popup-overlay active';
    overlay.innerHTML = `
        <div class="popup-content">
            <div class="popup-header">
                <span class="popup-title">ورود / ثبت‌نام</span>
                <button class="close-btn">&times;</button>
            </div>
            <div style="display: flex; flex-direction: column; gap: 10px; margin-top: 15px;">
                <button class="btn btn-primary choice-login-btn">ورود به اکانت</button>
                <button class="btn btn-secondary choice-register-btn">ثبت‌نام حساب جدید</button>
            </div>
        </div>
    `;
    document.body.appendChild(overlay);

    const closePopup = () => {
        overlay.classList.remove('active');
        setTimeout(() => overlay.remove(), 300);
    };

    overlay.querySelector('.close-btn').addEventListener('click', closePopup);

    overlay.querySelector('.choice-login-btn').addEventListener('click', () => {
        closePopup();
        openLoginPopup();
    });

    overlay.querySelector('.choice-register-btn').addEventListener('click', () => {
        closePopup();
        openRegisterPopup();
    });
}

// ==========================================
// REGISTER POPUP
// ==========================================
function openRegisterPopup() {
    const overlay = document.createElement('div');
    overlay.className = 'popup-overlay active';
    overlay.innerHTML = `
        <div class="popup-content">
            <div class="popup-header">
                <span class="popup-title">ثبت‌نام در سایت</span>
                <button class="close-btn">&times;</button>
            </div>
            <form id="regForm">
                <div class="form-group">
                    <label>نام (حداکثر ۶ حرف)</label>
                    <input type="text" id="regName" class="form-control" maxlength="6" required>
                </div>
                <div class="form-group">
                    <label>نام کاربری (بیشتر از ۴ حرف - فقط انگلیسی و عدد)</label>
                    <input type="text" id="regUsername" class="form-control" required>
                </div>
                <div class="form-group">
                    <label>رمز عبور (بیشتر از ۴ حرف)</label>
                    <input type="password" id="regPassword" class="form-control" required>
                </div>
                <button type="submit" class="btn btn-primary">ایجاد حساب</button>
            </form>
        </div>
    `;
    document.body.appendChild(overlay);

    const closePopup = () => {
        overlay.classList.remove('active');
        setTimeout(() => overlay.remove(), 300);
    };

    overlay.querySelector('.close-btn').addEventListener('click', closePopup);

    overlay.querySelector('#regForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        const name = document.getElementById('regName').value.trim();
        const username = document.getElementById('regUsername').value.trim().toLowerCase();
        const password = document.getElementById('regPassword').value;

        if (name.length > 6) return showCustomAlert('خطا', 'نام نباید بیشتر از ۶ حرف باشد.');
        if (username.length <= 4 || !/^[a-zA-Z0-9]+$/.test(username)) {
            return showCustomAlert('خطا', 'نام کاربری باید بیش از ۴ حرف و فقط شامل حروف انگلیسی و عدد باشد.');
        }
        if (password.length <= 4) return showCustomAlert('خطا', 'رمز عبور باید بیش از ۴ حرف باشد.');

        try {
            // بررسی تکراری نبودن نام کاربری
            const checkRes = await fetch(`${API_FIREBASE}/users/${username}`);
            if (checkRes.status === 200) {
                return showCustomAlert('خطا', 'این نام کاربری قبلاً ثبت شده است.');
            }

            const userData = { name, username, password };
            await fetch(`${API_FIREBASE}/users/${username}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(buildFirestoreFields(userData))
            });

            currentUser = userData;
            localStorage.setItem('user', JSON.stringify(userData));
            updateAuthUI();
            closePopup();
            showCustomAlert('تکمیل ثبت‌نام', 'اکانت با موفقیت ساخته شد.');
        } catch (err) {
            showCustomAlert('خطا', 'مشکلی در ساخت اکانت رخ داد.');
        }
    });
}

// ==========================================
// LOGIN POPUP
// ==========================================
function openLoginPopup() {
    const overlay = document.createElement('div');
    overlay.className = 'popup-overlay active';
    overlay.innerHTML = `
        <div class="popup-content">
            <div class="popup-header">
                <span class="popup-title">ورود به اکانت</span>
                <button class="close-btn">&times;</button>
            </div>
            <form id="loginForm">
                <div class="form-group">
                    <label>نام کاربری</label>
                    <input type="text" id="loginUsername" class="form-control" required>
                </div>
                <div class="form-group">
                    <label>رمز عبور</label>
                    <input type="password" id="loginPassword" class="form-control" required>
                </div>
                <button type="submit" class="btn btn-primary">ورود</button>
            </form>
        </div>
    `;
    document.body.appendChild(overlay);

    const closePopup = () => {
        overlay.classList.remove('active');
        setTimeout(() => overlay.remove(), 300);
    };

    overlay.querySelector('.close-btn').addEventListener('click', closePopup);

    overlay.querySelector('#loginForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        const username = document.getElementById('loginUsername').value.trim().toLowerCase();
        const password = document.getElementById('loginPassword').value;

        try {
            const res = await fetch(`${API_FIREBASE}/users/${username}`);
            if (res.status === 404) {
                return showCustomAlert('خطا', 'نام کاربری وجود ندارد.');
            }
            const doc = await res.json();
            const userData = parseFirestoreDoc(doc);

            if (userData.password !== password) {
                return showCustomAlert('خطا', 'رمز عبور اشتباه است.');
            }

            currentUser = userData;
            localStorage.setItem('user', JSON.stringify(userData));
            updateAuthUI();
            closePopup();
            showCustomAlert('موفقیت', 'با موفقیت وارد شدید.');
        } catch (err) {
            showCustomAlert('خطا', 'بروز خطا در برقراری ارتباط.');
        }
    });
}

// ==========================================
// SUPPORT POPUP
// ==========================================
function openSupportPopup() {
    const overlay = document.createElement('div');
    overlay.className = 'popup-overlay active';
    overlay.innerHTML = `
        <div class="popup-content">
            <div class="popup-header">
                <span class="popup-title">پشتیبانی</span>
                <button class="close-btn">&times;</button>
            </div>
            <button class="btn btn-primary support-admin-btn" style="margin-top:15px;">
                پشتیبانی (ارتباط با مدیر)
            </button>
        </div>
    `;
    document.body.appendChild(overlay);

    const closePopup = () => {
        overlay.classList.remove('active');
        setTimeout(() => overlay.remove(), 300);
    };

    overlay.querySelector('.close-btn').addEventListener('click', closePopup);

    overlay.querySelector('.support-admin-btn').addEventListener('click', () => {
        closePopup();
        if (!currentUser) {
            showCustomAlert('نیاز به ورود', 'ابتدا ثبت نام کنید یا وارد اکانت خود شوید.');
        } else {
            window.location.href = 'chat.html';
        }
    });
                                             }
      
