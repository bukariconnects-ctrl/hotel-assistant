require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const s = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function main() {
  const { data, error } = await s
    .from('organizations')
    .select('id, name, slug, category, status')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error:', error);
    return;
  }
  console.log('Total orgs:', data.length);
  console.table(data.map(o => ({ name: o.name, slug: o.slug, category: o.category, status: o.status })));
}

main();
