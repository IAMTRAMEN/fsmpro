import bcrypt from 'bcryptjs';

export default {
  async fetch(request: Request, env: any, ctx: any): Promise<Response> {
    const url = new URL(request.url);
    const method = request.method;
    const path = url.pathname;

    // CORS Headers
    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Encrypted-Yw-ID, X-Is-Login',
    };

    if (method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders });
    }

    try {
      // Auth: Login
      if (path === '/api/login' && method === 'POST') {
        const { email, password } = await request.json() as any;
        const stmt = env.DB.prepare('SELECT * FROM users WHERE email = ?');
        const user = await stmt.bind(email).first();

        if (!user) {
          return new Response(JSON.stringify({ error: 'Invalid credentials' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
        }

        const isValidPassword = await bcrypt.compare(password, user.password);
        if (!isValidPassword) {
          return new Response(JSON.stringify({ error: 'Invalid credentials' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
        }

        // Parse JSON fields
        if (user.address) user.address = JSON.parse(user.address);
        if (user.skills) user.skills = JSON.parse(user.skills);

        return new Response(JSON.stringify(user), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      }

      // Users: List
      if (path === '/api/users' && method === 'GET') {
        const { results } = await env.DB.prepare('SELECT * FROM users').all();
        const users = results.map((u: any) => ({
          ...u,
          address: u.address ? JSON.parse(u.address) : undefined,
          skills: u.skills ? JSON.parse(u.skills) : undefined
        }));
        return new Response(JSON.stringify(users), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      }

      // Users: Update (Profile)
      if (path.startsWith('/api/users/') && method === 'PUT') {
        const id = path.split('/').pop();
        const data = await request.json() as any;
        
        // Password check if changing password
        if (data.newPassword) {
           const current = await env.DB.prepare('SELECT password FROM users WHERE id = ?').bind(id).first();
           if (!current) {
             return new Response(JSON.stringify({ error: 'User not found' }), { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
           }
           const isValidOldPassword = await bcrypt.compare(data.oldPassword, current.password);
           if (!isValidOldPassword) {
             return new Response(JSON.stringify({ error: 'Incorrect old password' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
           }
           data.password = await bcrypt.hash(data.newPassword, 10);
        }

        // Build update query dynamically
        const fields = [];
        const values = [];
        if (data.name) { fields.push('name = ?'); values.push(data.name); }
        if (data.email) { fields.push('email = ?'); values.push(data.email); }
        if (data.password) { fields.push('password = ?'); values.push(data.password); }
        if (data.role) { fields.push('role = ?'); values.push(data.role); }
        if (data.avatar) { fields.push('avatar = ?'); values.push(data.avatar); }
        if (data.address) { fields.push('address = ?'); values.push(JSON.stringify(data.address)); }
        if (data.skills) { fields.push('skills = ?'); values.push(JSON.stringify(data.skills)); }
        if (data.status) { fields.push('status = ?'); values.push(data.status); }

        if (fields.length === 0) {
           return new Response(JSON.stringify({ success: true }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
        }

        values.push(id);
        const query = `UPDATE users SET ${fields.join(', ')} WHERE id = ?`;
        await env.DB.prepare(query).bind(...values).run();

        // Return updated user
        const updated = await env.DB.prepare('SELECT * FROM users WHERE id = ?').bind(id).first();
        if (updated) {
            if (updated.address) updated.address = JSON.parse(updated.address);
            if (updated.skills) updated.skills = JSON.parse(updated.skills);
        }

        return new Response(JSON.stringify(updated), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      }

      // Users: Create
      if (path === '/api/users' && method === 'POST') {
        const data = await request.json() as any;
        const id = data.id || `u${Date.now()}`;
        const hashedPassword = await bcrypt.hash(data.password || 'password', 10);
        await env.DB.prepare('INSERT INTO users (id, name, email, password, role, avatar, address, skills, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)')
          .bind(
            id,
            data.name,
            data.email,
            hashedPassword,
            data.role,
            data.avatar,
            data.address ? JSON.stringify(data.address) : null,
            data.skills ? JSON.stringify(data.skills) : null,
            data.status || 'Available'
          ).run();
        return new Response(JSON.stringify({ id }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      }

      // Users: Delete
      if (path.startsWith('/api/users/') && method === 'DELETE') {
        const id = path.split('/').pop();
        await env.DB.prepare('DELETE FROM users WHERE id = ?').bind(id).run();
        return new Response(JSON.stringify({ success: true }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      }

      return new Response('Not Found', { status: 404, headers: corsHeaders });
    } catch (e: any) {
      return new Response(JSON.stringify({ error: e.message }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }
  }
};
