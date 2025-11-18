import db from "../config/db.js";

// ✅ Update profile (Multi-Tenant + JSON meta)
export const updateProfile = async (req, res) => {
  try {
    // Check session
    if (!req.session?.user)
      return res.status(401).json({ success: false, message: "Unauthorized" });

    const userId = parseInt(req.params.id) || req.session.user.id;
    const tenantId = req.session.user.tenant_id;

    const {
      name_en,
      name_bn,
      father_name,
      mother_name,
      dob,
      gender,
      email,
      phone,
      role,
      permanent_address,
      current_address,
    } = req.body;

    // 1️⃣ Update basic fields (name, email, phone, role)
    await db.query(
      `UPDATE users 
       SET name_en = ?, name_bn = ?, email = ?, phone = ?, role_id = ?
       WHERE id = ? AND tenant_id = ? AND deleted_at IS NULL`,
      [name_en, name_bn, email, phone, role, userId, tenantId]
    );

    // 2️⃣ Update JSON meta (father, mother, dob, gender, address)
    await db.query(
      `UPDATE users 
       SET meta = JSON_MERGE_PATCH(
         COALESCE(meta, '{}'),
         JSON_OBJECT(
           'name_en', ?, 
           'name_bn', ?, 
           'father_name', ?, 
           'mother_name', ?, 
           'dob', ?, 
           'gender', ?, 
           'permanent_address', ?, 
           'current_address', ?
         )
       )
       WHERE id = ? AND tenant_id = ? AND deleted_at IS NULL`,
      [name_en, name_bn, father_name, mother_name, dob, gender, permanent_address, current_address, userId, tenantId]
    );

    // 3️⃣ Keep session in-sync so UI updates immediately
    try {
      if (req.session && req.session.user) {
        req.session.user.email = email || req.session.user.email;
        req.session.user.name = name_en || name_bn || req.session.user.name;
        req.session.user.phone = phone || req.session.user.phone;

        // Update meta in session
        req.session.user.meta = req.session.user.meta || {};
        req.session.user.meta = {
          ...req.session.user.meta,
          name_en,
          name_bn,
          father_name,
          mother_name,
          dob,
          gender,
          permanent_address,
          current_address,
        };
      }
    } catch (sessErr) {
      console.error('Failed to sync session after profile update', sessErr);
    }

    res.json({ success: true, message: "Profile updated successfully" });

  } catch (err) {
    console.error("Error updating profile:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};
