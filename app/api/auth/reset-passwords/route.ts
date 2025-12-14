import { NextRequest, NextResponse } from 'next/server';
import { getServiceRoleClient } from '@/lib/supabase/server';
import { hashPassword } from '@/lib/auth/security';

/**
 * POST /api/auth/reset-passwords
 * Tüm admin kullanıcılarının şifrelerini sıfırlar
 * SADECE GELİŞTİRME AMAÇLI - Production'da kaldırın!
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = getServiceRoleClient();
    
    // Varsayılan şifre
    const defaultPassword = 'Admin123!';
    const hashedPassword = await hashPassword(defaultPassword);
    
    // Tüm organizasyonları al
    const { data: organizations } = await supabase
      .from('organizations')
      .select('id, name, slug');
    
    const results: any[] = [];
    
    // 1. Franchise Yöneticisi (Super Admin) - admin@akademihub.com
    const superAdminEmail = 'admin@akademihub.com';
    const { data: existingSuperAdmin } = await supabase
      .from('app_users')
      .select('id')
      .eq('email', superAdminEmail)
      .single();
    
    if (existingSuperAdmin) {
      await supabase
        .from('app_users')
        .update({ password_hash: hashedPassword, status: 'active' })
        .eq('id', existingSuperAdmin.id);
      
      results.push({
        email: superAdminEmail,
        name: 'Franchise Yöneticisi',
        role: 'super_admin',
        organization: 'Tüm Kurumlar',
        password: defaultPassword,
        status: 'güncellendi'
      });
    } else {
      // Yoksa oluştur
      await supabase
        .from('app_users')
        .insert({
          email: superAdminEmail,
          password_hash: hashedPassword,
          name: 'Franchise Yöneticisi',
          role: 'super_admin',
          is_super_admin: true,
          status: 'active',
          organization_id: null,
          permissions: {
            finance: { view: true, edit: true, delete: true },
            students: { view: true, edit: true, delete: true },
            reports: { view: true, edit: true, delete: true }
          }
        });
      
      results.push({
        email: superAdminEmail,
        name: 'Franchise Yöneticisi',
        role: 'super_admin',
        organization: 'Tüm Kurumlar',
        password: defaultPassword,
        status: 'oluşturuldu'
      });
    }
    
    // 2. Her organizasyon için admin oluştur/güncelle
    if (organizations && organizations.length > 0) {
      for (const org of organizations) {
        // Slug'dan email oluştur
        const adminEmail = `admin@${org.slug?.replace(/-/g, '') || org.name.toLowerCase().replace(/\s+/g, '')}.com`;
        
        const { data: existingAdmin } = await supabase
          .from('app_users')
          .select('id')
          .eq('email', adminEmail)
          .single();
        
        if (existingAdmin) {
          await supabase
            .from('app_users')
            .update({ 
              password_hash: hashedPassword, 
              status: 'active',
              organization_id: org.id 
            })
            .eq('id', existingAdmin.id);
          
          results.push({
            email: adminEmail,
            name: `${org.name} Admin`,
            role: 'admin',
            organization: org.name,
            password: defaultPassword,
            status: 'güncellendi'
          });
        } else {
          // Yoksa oluştur
          await supabase
            .from('app_users')
            .insert({
              email: adminEmail,
              password_hash: hashedPassword,
              name: `${org.name} Admin`,
              role: 'admin',
              is_super_admin: false,
              status: 'active',
              organization_id: org.id,
              permissions: {
                finance: { view: true, edit: true, delete: true },
                students: { view: true, edit: true, delete: true },
                reports: { view: true, edit: true, delete: true }
              }
            });
          
          results.push({
            email: adminEmail,
            name: `${org.name} Admin`,
            role: 'admin',
            organization: org.name,
            password: defaultPassword,
            status: 'oluşturuldu'
          });
        }
      }
    }
    
    // Dikmen Admin için özel kontrol (eski email)
    const dikmenEmail = 'admin@dikmen.com';
    const { data: dikmenAdmin } = await supabase
      .from('app_users')
      .select('id')
      .eq('email', dikmenEmail)
      .single();
    
    if (dikmenAdmin) {
      // Dikmen Çözüm Kurs organizasyonunu bul
      const dikmenOrg = organizations?.find(o => o.name.toLowerCase().includes('dikmen'));
      
      await supabase
        .from('app_users')
        .update({ 
          password_hash: hashedPassword, 
          status: 'active',
          organization_id: dikmenOrg?.id || null
        })
        .eq('id', dikmenAdmin.id);
      
      // Eğer zaten results'ta varsa ekleme
      const alreadyExists = results.some(r => r.email === dikmenEmail);
      if (!alreadyExists) {
        results.push({
          email: dikmenEmail,
          name: 'Dikmen Admin',
          role: 'admin',
          organization: dikmenOrg?.name || 'Dikmen Çözüm Kurs',
          password: defaultPassword,
          status: 'güncellendi'
        });
      }
    }
    
    return NextResponse.json({
      success: true,
      message: 'Tüm admin şifreleri sıfırlandı',
      defaultPassword,
      users: results
    });
    
  } catch (error: any) {
    console.error('Reset passwords error:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

/**
 * GET /api/auth/reset-passwords
 * Mevcut kullanıcıları listeler
 */
export async function GET() {
  try {
    const supabase = getServiceRoleClient();
    
    const { data: users, error } = await supabase
      .from('app_users')
      .select('id, email, name, role, status, is_super_admin, organization_id')
      .order('is_super_admin', { ascending: false });
    
    if (error) throw error;
    
    // Organizasyon isimlerini al
    const { data: orgs } = await supabase
      .from('organizations')
      .select('id, name');
    
    const orgMap = new Map(orgs?.map(o => [o.id, o.name]) || []);
    
    const enrichedUsers = users?.map(u => ({
      ...u,
      organization_name: u.organization_id ? orgMap.get(u.organization_id) : 'Tüm Kurumlar'
    }));
    
    return NextResponse.json({
      success: true,
      data: enrichedUsers
    });
    
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
