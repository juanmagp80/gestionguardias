"use client"
import AsignarVacaciones from "../components/AsignarVacaciones/AsignarVacaciones";
import ListarVacaciones from "../components/ListarVacaciones/ListarVacaciones";

export default function Vacaciones() {



    return (
        <div className="min-h-screen bg-gray-100">
            <div className="container mx-auto p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <AsignarVacaciones />
                    <ListarVacaciones />
                </div>
            </div>
        </div>
    );
}
