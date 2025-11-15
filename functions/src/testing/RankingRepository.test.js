import { describe, it, expect, vi, beforeEach } from "vitest";
import { RankingRepository } from "../infraestructure/adapters/RankingRepository.js";
import DBConnection from "../infraestructure/ports/DBConnection.js";

vi.mock("../infraestructure/ports/DBConnection.js", () => {
  return {
    default: class {
      constructor() {
        this.putItem = vi.fn();
        this.getItemObject = vi.fn();
        this.updateItem = vi.fn();
        this.deleteItem = vi.fn();
        this.getAllItemsList = vi.fn();
        this.getItemsByField = vi.fn();
      }
    },
  };
});

describe("RankingRepository - Métodos esenciales", () => {
  let repo;
  let mockDB;

  beforeEach(() => {
    mockDB = new DBConnection();
    repo = new RankingRepository();
    repo.db = mockDB;
  });

  it("save guarda un ranking y devuelve su ID", async () => {
    const ranking = { id: "r1", puntos: 100 };
    mockDB.putItem.mockResolvedValue("r1");

    const result = await repo.save(ranking);

    expect(result).toBe("r1");
    expect(mockDB.putItem).toHaveBeenCalledWith("rankings", ranking, "r1");
  });

  it("findById devuelve un ranking existente", async () => {
    const ranking = { puntos: 100 };
    mockDB.getItemObject.mockResolvedValue(ranking);

    const result = await repo.findById("r1");

    expect(result).toEqual({ id: "r1", ...ranking });
    expect(mockDB.getItemObject).toHaveBeenCalledWith("rankings", "r1");
  });

  it("findById devuelve null si el ranking no existe", async () => {
    mockDB.getItemObject.mockResolvedValue(null);

    const result = await repo.findById("r1");

    expect(result).toBeNull();
    expect(mockDB.getItemObject).toHaveBeenCalledWith("rankings", "r1");
  });

  it("update actualiza un ranking existente", async () => {
    const partial = { puntos: 150 };
    mockDB.updateItem.mockResolvedValue();

    const result = await repo.update("r1", partial);

    expect(result).toBe("r1");
    expect(mockDB.updateItem).toHaveBeenCalledWith("rankings", "r1", {
      ...partial,
      updatedAt: expect.any(String),
    });
  });

  it("delete elimina un ranking existente", async () => {
    mockDB.deleteItem.mockResolvedValue();

    const result = await repo.delete("r1");

    expect(result).toBe("r1");
    expect(mockDB.deleteItem).toHaveBeenCalledWith("rankings", "r1");
  });

  it("getAll devuelve todos los rankings", async () => {
    const rankings = [{ id: "r1", puntos: 100 }, { id: "r2", puntos: 200 }];
    mockDB.getAllItemsList.mockResolvedValue(rankings);

    const result = await repo.getAll();

    expect(result).toEqual(rankings);
    expect(mockDB.getAllItemsList).toHaveBeenCalledWith("rankings");
  });

  it("getByTemporada devuelve rankings por temporada", async () => {
    const rankings = [{ id: "r1", temporadaID: "t1" }];
    mockDB.getItemsByField.mockResolvedValue(rankings);

    const result = await repo.getByTemporada("t1");

    expect(result).toEqual(rankings);
    expect(mockDB.getItemsByField).toHaveBeenCalledWith("rankings", "temporadaID", "t1");
  });

  it("getLeaderboard devuelve rankings ordenados por puntos", async () => {
    const rankings = [
      { id: "r1", puntos: 100 },
      { id: "r2", puntos: 200 },
      { id: "r3", puntos: 150 },
    ];
    mockDB.getAllItemsList.mockResolvedValue(rankings);

    const result = await repo.getLeaderboard({ limit: 2 });

    expect(result).toEqual([
      { id: "r2", puntos: 200 },
      { id: "r3", puntos: 150 },
    ]);
    expect(mockDB.getAllItemsList).toHaveBeenCalledWith("rankings");
  });

  it("adjustPoints ajusta los puntos de un ranking", async () => {
    const current = { puntos: 100 };
    mockDB.getItemObject.mockResolvedValue(current);
    mockDB.updateItem.mockResolvedValue();

    const result = await repo.adjustPoints("r1", 50);

    expect(result).toBe("r1");
    expect(mockDB.updateItem).toHaveBeenCalledWith("rankings", "r1", {
      puntos: 150,
      updatedAt: expect.any(String),
    });
  });

  it("adjustCounter ajusta un contador en un ranking", async () => {
    const current = { victorias: 10 };
    mockDB.getItemObject.mockResolvedValue(current);
    mockDB.updateItem.mockResolvedValue();

    const result = await repo.adjustCounter("r1", "victorias", 5);

    expect(result).toBe("r1");
    expect(mockDB.updateItem).toHaveBeenCalledWith("rankings", "r1", {
      victorias: 15,
      updatedAt: expect.any(String),
    });
  });

  it("adjustMany ajusta múltiples campos en un ranking", async () => {
    const current = { victorias: 10, derrotas: 5 };
    mockDB.getItemObject.mockResolvedValue(current);
    mockDB.updateItem.mockResolvedValue();

    const result = await repo.adjustMany("r1", { victorias: 2, derrotas: -1 });

    expect(result).toBe("r1");
    expect(mockDB.updateItem).toHaveBeenCalledWith("rankings", "r1", {
      victorias: 12,
      derrotas: 4,
      updatedAt: expect.any(String),
    });
  });
});