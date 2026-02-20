import { NextResponse } from 'next/server'

export async function GET(request: Request) {
    const { origin } = new URL(request.url)
    // Supabase Auth is removed. Redirect to home.
    return NextResponse.redirect(`${origin}/`)
}
