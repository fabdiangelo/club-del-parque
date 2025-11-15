import { describe, it, expect, vi, beforeEach } from "vitest";


vi.mock("../infraestructure/ports/DBConnection.js", () => {
    return {
        default: vi.fn().mockImplementation(function () {
            return {
                getItem: vi.fn(),
                getAllItems: vi.fn(),
                putItem: vi.fn(),
                deleteItem: vi.fn(),
                updateItem: vi.fn()
            };
        }),
    };
});

import DBConnection from "../infraestructure/ports/DBConnection.js";
import { ReservaRepository } from "../infraestructure/adapters/ReservaRepository.js";

describe("ReservaRepository - Métodos esenciales", () => {

    let repo;
    let mockDB;

    beforeEach(() => {
        mockDB = new DBConnection();
        repo = new ReservaRepository();

        repo.db = mockDB;

        repo.getById = vi.fn();
    });

    it("save crea una reserva correctamente cuando no hay conflictos", async () => {

        const reserva = {
            id: "r1",
            canchaId: "can1",
            jugadoresIDS: ["u1", "u2"],
            quienPaga: "u1",
            autor: "u1",
            fechaHora: new Date(Date.now() + 60000).toISOString(),
            duracion: 60
        };
        mockDB.getAllItems.mockResolvedValue([]);

        // todas las validaciones de cancha, jugadores, pagador → ok
        mockDB.getItem.mockResolvedValue({ id: "ok" });

        mockDB.putItem.mockResolvedValue({ id: "r1" });

        const result = await repo.save(reserva);

        expect(result).toBe("r1");
    });

    it("save lanza error si ya existe una reserva en el mismo horario y cancha", async () => {

        mockDB.getAllItems.mockResolvedValueOnce([
            {
                id: "r1",
                canchaId: "can1",
                fechaHora: new Date(Date.now() + 10000).toISOString(),
                duracion: 60
            }
        ]);

        const reserva = {
            canchaId: "can1",
            jugadoresIDS: ["u1"],
            quienPaga: "u1",
            autor: "u1",
            fechaHora: new Date(Date.now() + 10000).toISOString(),
            duracion: 60
        };

        await expect(repo.save(reserva))
            .rejects
            .toThrow("Ya existe una reserva para la misma cancha en el mismo rango de tiempo");
    });

    it("save lanza error si la cancha no existe", async () => {

        mockDB.getAllItems.mockResolvedValueOnce([]);
        mockDB.getItem.mockResolvedValueOnce(null);

        const reserva = {
            canchaId: "X",
            jugadoresIDS: ["u1", "u2"],
            quienPaga: "u1",
            autor: "u1",
            fechaHora: new Date(Date.now() + 20000).toISOString(),
            duracion: 60
        };

        await expect(repo.save(reserva))
            .rejects
            .toThrow("La cancha asociada no existe");
    });
    it("aceptarInivitacion agrega jugador", async () => {

        repo.getById.mockResolvedValue({
            id: "r1",
            aceptadoPor: [],
            jugadoresIDS: ["u1", "u2"],
        });
        mockDB.getItem.mockResolvedValue(() => {
            return { id: "u1" };
        })

        mockDB.updateItem.mockResolvedValue({
            id: "r1",
            aceptadoPor: ["u1"]
        });


        const result = await repo.aceptarInivitacion("r1", "u1");

        expect(result.aceptadoPor).toContain("u1");
    });

    it("aceptarInivitacion lanza error si jugador ya aceptó", async () => {

        repo.getById.mockResolvedValue({
            id: "r1",
            aceptadoPor: [],
            jugadoresIDS: ["u1", "u2"],
        });

        mockDB.updateItem.mockResolvedValue({
    id: "r1",
    aceptadoPor: ["u1"]
});

        mockDB.getItem.mockResolvedValue(() => {
            return { id: "u1" };
        })

        const result = await repo.aceptarInivitacion("r1", "u1");

        expect(result.aceptadoPor).toContain("u1");
        await expect(
            repo.aceptarInivitacion("r1", "u1")
        ).rejects.toThrow("El jugador ya ha aceptado la invitación");
    });

});
