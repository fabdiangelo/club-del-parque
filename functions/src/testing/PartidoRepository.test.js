import { describe, it, expect, vi, beforeEach } from "vitest";


vi.mock("../infraestructure/ports/DBConnection.js", () => {
    return {
        default: vi.fn().mockImplementation(function () {
            return {
                getItem: vi.fn(),
                getAllItems: vi.fn(),
                putItem: vi.fn(),
                deleteItem: vi.fn(),
            };
        }),
    };
});

import DBConnection from "../infraestructure/ports/DBConnection.js";
import { PartidoRepository } from "../infraestructure/adapters/PartidoRepository.js";
describe("PartidoRepository - Métodos esenciales", () => {
    let repo;
    let mockDB;

    beforeEach(() => {
        mockDB = new DBConnection();
        repo = new PartidoRepository();
        repo.db = mockDB;
    });

    it("save crea un partido si temporada, cancha y jugadores existen", async () => {
        mockDB.getItem.mockResolvedValueOnce({ id: "temp1" });
        mockDB.getItem.mockResolvedValueOnce({ id: "can1" });
        mockDB.getItem.mockResolvedValueOnce({ id: "jug1" });

        mockDB.putItem.mockResolvedValueOnce({ id: "p1" });

        const partido = {
            id: "p1",
            temporadaID: "temp1",
            canchaID: "can1",
            jugadores: ["jug1"]
        };

        const result = await repo.save(partido);

        expect(result).toBe("p1");
        expect(mockDB.putItem).toHaveBeenCalled();
    });

    it("save lanza error si la temporada no existe", async () => {
        mockDB.getItem.mockImplementation(async (tipo, id) => {
            if (tipo === "temporadas" && id === "X") return null; 
            return { id };
        });

        await expect(
            repo.save({ temporadaID: "X", canchaID: "can1", jugadores: ["jug1"] })
        ).rejects.toThrow("La temporada asociada no existe");
    });

    it("save lanza error si un jugador no existe", async () => {
    mockDB.getItem.mockImplementation(async (tipo, id) => {
        if (tipo === "temporadas" && id === "temp1") return { id: "temp1" };
        if (tipo === "canchas" && id === "can1") return { id: "can1" };

        if (tipo === "usuarios" && id === "J99") return null; 
        if (tipo === "federados" && id === "J99") return null;
        return { id };
    });

    await expect(
        repo.save({ temporadaID: "temp1", canchaID: "can1", jugadores: ["J99"] })
    ).rejects.toThrow("El jugador con ID J99 no existe");
});

    it("getById devuelve null si no existe", async () => {
        mockDB.getItem.mockResolvedValueOnce(null);

        const result = await repo.getById("X");

        expect(result).toBe(null);
    });

    it("getById devuelve el partido", async () => {
        mockDB.getItem.mockResolvedValueOnce({ fecha: "hoy" });

        const result = await repo.getById("A1");

        expect(result).toEqual({ id: "A1", fecha: "hoy" });
    });

    it("getAll devuelve todos los partidos", async () => {
        mockDB.getAllItems.mockResolvedValueOnce([{ id: "p1" }, { id: "p2" }]);

        const result = await repo.getAll();

        expect(result.length).toBe(2);
    });

});
