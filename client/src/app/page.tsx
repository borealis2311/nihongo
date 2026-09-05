import { redirect } from 'next/navigation'
import { getChapters } from '@/lib/strapi'

export default async function Home() {
  const chapters = await getChapters()
  const firstChapter = chapters[0]
  const firstLesson = firstChapter?.lessons[0]

  if (firstChapter && firstLesson) {
    redirect(`/docs/${firstChapter.slug}/${firstLesson.slug}`)
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background text-foreground">
      <p className="text-muted-foreground">Chưa có nội dung nào trong CMS.</p>
    </div>
  )
}
