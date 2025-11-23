<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width,initial-scale=1" />
<title>E-Library — Login</title>

<style>
  :root {
    --bg: #f4f6fa;
    --card: #fff;
    --muted: #6b7280;
    --accent: #2563eb;
    --shadow: rgba(0,0,0,0.08);
    --radius: 14px;
    --container-width: 400px;
  }

  * { box-sizing: border-box; }
  body, html { margin:0; padding:0; font-family: Inter, sans-serif; background: var(--bg); display:flex; justify-content:center; align-items:center; height:100vh; }
  .container { background: var(--card); width:100%; max-width: var(--container-width); padding:32px; border-radius:var(--radius); box-shadow:0 12px 32px var(--shadow); text-align:center; }

  .logo { font-size:28px; font-weight:700; margin-bottom:8px; display:block; }
  .tagline { font-size:14px; color: var(--muted); margin-bottom:24px; }

  .oauth-btn { display:flex; align-items:center; justify-content:center; gap:8px; padding:12px; margin:12px 0; border-radius: var(--radius); cursor:pointer; border:1px solid #d1d5db; transition: all 0.2s ease; font-weight:600; }
  .oauth-btn img { width:20px; height:20px; }
  .oauth-btn.google { background:#fff; color:#000; }
  .oauth-btn.google:hover { background:#f3f4f6; }
  .oauth-btn.apple { background:#000; color:#fff; }
  .oauth-btn.apple:hover { opacity:0.85; }
  .oauth-btn.demo { background:#10b981; color:#fff; }
  .oauth-btn.demo:hover { opacity:0.85; }

  .or-divider { margin:16px 0; font-size:12px; color: var(--muted); position: relative; }
  .or-divider::before, .or-divider::after { content:""; position:absolute; top:50%; width:40%; height:1px; background:#d1d5db; }
  .or-divider::before { left:0; }
  .or-divider::after { right:0; }

  .form-group { margin-bottom:16px; text-align:left; }
  .form-group label { display:block; font-size:13px; color: var(--muted); margin-bottom:4px; }
  .form-group input { width:100%; padding:12px 16px; border-radius:var(--radius); border:1px solid #d1d5db; outline:none; font-size:14px; }
  .form-group input:focus { border-color: var(--accent); box-shadow:0 4px 12px rgba(37,99,235,0.15); }

  .btn { width:100%; padding:12px; border-radius:var(--radius); border:none; font-weight:600; cursor:pointer; background: var(--accent); color:#fff; transition: all 0.2s ease; margin-top:8px; }
  .btn:hover { background:#1d4ed8; }

  .signup-link { margin-top:16px; font-size:13px; color: var(--muted); }
  .signup-link a { color: var(--accent); text-decoration:none; font-weight:600; }
</style>
</head>

<body>
<div class="container">
  <span class="logo">📚 eLibrary AI</span>
  <p class="tagline">Login to access your saved search history</p>

  <!-- OAuth Login -->
  <div class="oauth-btn google" id="googleLogin">
    <img src="https://img.icons8.com/color/48/000000/google-logo.png" /> Continue with Google
  </div>
  <div class="oauth-btn apple" id="appleLogin">
    <img src="https://img.icons8.com/ios-filled/50/ffffff/mac-os.png" /> Continue with Apple
  </div>
  <div class="oauth-btn demo" id="demoLogin">
    🧪 Try Demo Account
  </div>

  <div class="or-divider">or</div>

  <!-- Email Login Form -->
  <div id="emailForm">
    <div class="form-group">
      <label for="email">Email</label>
      <input type="email" id="email" placeholder="you@example.com" />
    </div>
    <div class="form-group">
      <label for="password">Password</label>
      <input type="password" id="password" placeholder="********" />
    </div>
    <button class="btn" id="loginBtn">Log In</button>
  </div>

  <p class="signup-link">Don't have an account? <a href="register.html">Sign up</a></p>
</div>

<script>
  // OAuth buttons
  document.getElementById('googleLogin').onclick = () => { window.location.href = '/auth/google'; };
  document.getElementById('appleLogin').onclick = () => { window.location.href = '/auth/apple'; };

  // Demo account
  document.getElementById('demoLogin').onclick = async () => {
    try {
      const res = await fetch('/auth/demo', { method:'POST' });
      const data = await res.json();
      if(data.status === 'success'){
        localStorage.setItem('elib_user', JSON.stringify(data.user));
        window.location.href = '/index.html';
      } else {
        alert(data.message || "Demo account creation failed");
      }
    } catch(err){
      alert("Demo account creation failed — network/server error");
    }
  };

  // Email login
  document.getElementById('loginBtn').onclick = async () => {
    const email = document.getElementById('email').value.trim();
    const password = document.getElementById('password').value.trim();

    if(!email || !password){
      alert("Please fill all fields");
      return;
    }

    try {
      const res = await fetch('/auth/login', {
        method:'POST',
        headers:{'Content-Type':'application/json'},
        body: JSON.stringify({ email, password })
      });
      const data = await res.json();

      if(data.status === 'success'){
        localStorage.setItem('elib_user', JSON.stringify(data.user));
        window.location.href = '/index.html';
      } else {
        alert(data.message || "Login failed");
      }
    } catch(err){
      alert("Login failed — network/server error");
    }
  };
</script>
</body>
</html>