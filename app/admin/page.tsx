import { Button } from "@/components/ui/button"
import { ArrowLeft, Calendar, Users, Ruler, Clock, Building2, Briefcase, Repeat } from "lucide-react"
import Link from "next/link"

export default function AdminPage() {
  return (
    <div className="container mx-auto p-4">
      <div className="flex items-center gap-4 mb-8">
        <Link href="/">
          <Button variant="outline" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <h1 className="text-2xl font-bold">Amministrazione</h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <Link href="/admin/agenti">
          <Button className="w-full h-24 flex flex-col items-center justify-center gap-2">
            <Users className="h-8 w-8" />
            <span>Gestione Agenti</span>
          </Button>
        </Link>

        <Link href="/admin/turni">
          <Button className="w-full h-24 flex flex-col items-center justify-center gap-2">
            <Clock className="h-8 w-8" />
            <span>Gestione Turni</span>
          </Button>
        </Link>

        <Link href="/admin/impianti">
          <Button className="w-full h-24 flex flex-col items-center justify-center gap-2">
            <Building2 className="h-8 w-8" />
            <span>Gestione Impianti</span>
          </Button>
        </Link>

        <Link href="/admin/mansioni">
          <Button className="w-full h-24 flex flex-col items-center justify-center gap-2">
            <Briefcase className="h-8 w-8" />
            <span>Gestione Mansioni</span>
          </Button>
        </Link>

        <Link href="/admin/ciclicita">
          <Button className="w-full h-24 flex flex-col items-center justify-center gap-2">
            <Repeat className="h-8 w-8" />
            <span>Gestione Ciclicità</span>
          </Button>
        </Link>

        <Link href="/admin/righelli">
          <Button className="w-full h-24 flex flex-col items-center justify-center gap-2">
            <Ruler className="h-8 w-8" />
            <span>Gestione Righelli</span>
          </Button>
        </Link>

        <Link href="/admin/assenze">
          <Button className="w-full h-24 flex flex-col items-center justify-center gap-2">
            <Calendar className="h-8 w-8" />
            <span>Gestione Assenze</span>
          </Button>
        </Link>
      </div>
    </div>
  )
} 