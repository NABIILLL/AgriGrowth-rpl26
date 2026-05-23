import { Webhook } from 'svix'
import { headers } from 'next/headers'
import { WebhookEvent } from '@clerk/nextjs/server'
import { createClient } from '@supabase/supabase-js'
import { clerkClient } from '@clerk/nextjs/server'

export async function POST(req: Request) {
  const WEBHOOK_SECRET = process.env.WEBHOOK_SECRET

  if (!WEBHOOK_SECRET) {
    throw new Error('Please add WEBHOOK_SECRET from Clerk Dashboard to .env or .env.local')
  }

  // Get the headers
  const headerPayload = await headers()
  const svix_id = headerPayload.get('svix-id')
  const svix_timestamp = headerPayload.get('svix-timestamp')
  const svix_signature = headerPayload.get('svix-signature')

  if (!svix_id || !svix_timestamp || !svix_signature) {
    return new Response('Error occured -- no svix headers', {
      status: 400,
    })
  }

  const payload = await req.json()
  const body = JSON.stringify(payload)
  const wh = new Webhook(WEBHOOK_SECRET)

  let evt: WebhookEvent

  try {
    evt = wh.verify(body, {
      'svix-id': svix_id,
      'svix-timestamp': svix_timestamp,
      'svix-signature': svix_signature,
    }) as WebhookEvent
  } catch (err) {
    console.error('Error verifying webhook:', err)
    return new Response('Error occured', {
      status: 400,
    })
  }

  const eventType = evt.type

  if (eventType === 'user.created') {
    const { id, email_addresses, first_name, last_name } = evt.data
    const email = email_addresses[0]?.email_address
    const name = [first_name, last_name].filter(Boolean).join(' ') || email?.split('@')[0] || 'User'

    // Initialize Supabase admin client
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    try {
      // 1. Create User in Supabase Auth (auth.users)
      const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
        email: email,
        email_confirm: true,
        user_metadata: { name: name }
      })

      if (authError || !authData.user) {
        console.error('Error creating user in Supabase auth:', authError)
        return new Response('Error creating user in Supabase auth', { status: 500 })
      }

      const supabaseUuid = authData.user.id

      // 2. Insert into public.profiles (if your Supabase doesn't have an auto-trigger doing this)
      // If you have a trigger on auth.users that inserts into profiles, you can remove this block!
      const { error: profileError } = await supabaseAdmin.from('profiles').insert({
        id: supabaseUuid,
        name: name,
        email: email,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      if (profileError) {
         console.warn('Could not insert into profiles (maybe trigger already did it):', profileError)
      }

      // 3. Save Supabase UUID to Clerk publicMetadata
      // In @clerk/nextjs v6+, clerkClient() is an async function
      const client = await clerkClient()
      await client.users.updateUserMetadata(id, {
        publicMetadata: {
          supabase_uuid: supabaseUuid
        }
      })

      console.log(`User ${id} successfully synced to Supabase Auth with UUID ${supabaseUuid}.`)
    } catch (error) {
      console.error('Webhook processing error:', error)
      return new Response('Internal Server Error', { status: 500 })
    }
  }

  return new Response('', { status: 200 })
}
