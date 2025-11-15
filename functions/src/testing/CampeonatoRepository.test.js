import { describe, it, expect, vi, beforeEach } from "vitest";
import { CampeonatoRepository } from "../infraestructure/adapters/CampeonatoRepository.js";
import DBConnection from "../infraestructure/ports/DBConnection.js";
import StorageConnection from "../infraestructure/ports/StorageConnection.js";

vi.mock("../infraestructure/ports/DBConnection.js", () => {
  return {
    default: class {
      constructor() {
        this.putItem = vi.fn();
        this.getItem = vi.fn();
        this.getAllItems = vi.fn();
        this.updateItem = vi.fn();
      }
    },
  };
});

vi.mock("../infraestructure/ports/StorageConnection.js", () => {
  return {
    default: class {
      constructor() {
        this.delete = vi.fn();
        this.uploadBuffer = vi.fn();
        this.buildDestination = vi.fn();
      }
    },
  };
});

describe("CampeonatoRepository - Métodos esenciales", () => {
  let repo;
  let mockDB;
  let mockStorage;

  beforeEach(() => {
    mockDB = new DBConnection();
    mockStorage = new StorageConnection();
    repo = new CampeonatoRepository();
    repo.db = mockDB;
    repo.storage = mockStorage;
  });

  it("save guarda un campeonato y devuelve su ID", async () => {
    const campeonato = { id: "c1", nombre: "Campeonato 1" };
    mockDB.putItem.mockResolvedValue({ id: "c1" });

    const result = await repo.save(campeonato);

    expect(result).toBe("c1");
    expect(mockDB.putItem).toHaveBeenCalledWith("campeonatos", campeonato, "c1");
  });

  it("findById devuelve un campeonato existente", async () => {
    const campeonato = { id: "c1", nombre: "Campeonato 1" };
    mockDB.getItem.mockResolvedValue(campeonato);

    const result = await repo.findById("c1");

    expect(result).toEqual({ id: "c1", ...campeonato });
    expect(mockDB.getItem).toHaveBeenCalledWith("campeonatos", "c1");
  });

  it("findById devuelve null si el campeonato no existe", async () => {
    mockDB.getItem.mockResolvedValue(null);

    const result = await repo.findById("c1");

    expect(result).toBeNull();
    expect(mockDB.getItem).toHaveBeenCalledWith("campeonatos", "c1");
  });

  it("getAll devuelve todos los campeonatos", async () => {
    const campeonatos = [{ id: "c1" }, { id: "c2" }];
    mockDB.getAllItems.mockResolvedValue(campeonatos);

    const result = await repo.getAll();

    expect(result).toEqual(campeonatos);
    expect(mockDB.getAllItems).toHaveBeenCalledWith("campeonatos");
  });

  it("update actualiza un campeonato existente", async () => {
    const campeonato = { nombre: "Campeonato Actualizado" };
    mockDB.updateItem.mockResolvedValue({ id: "c1", ...campeonato });

    const result = await repo.update("c1", campeonato);

    expect(result).toEqual({ id: "c1", ...campeonato });
    expect(mockDB.updateItem).toHaveBeenCalledWith("campeonatos", "c1", campeonato);
  });

  it("setReglamento sube un reglamento y actualiza el campeonato", async () => {
    const file = {
      buffer: Buffer.from("PDF content"),
      originalname: "reglamento.pdf",
      mimetype: "application/pdf",
    };
    const uploaded = {
      publicUrl: "https://example.com/reglamento.pdf",
      storagePath: "campeonatos/c1/reglamento.pdf",
    };

    mockDB.getItem.mockResolvedValue({ id: "c1", reglamentoPath: null });
    mockStorage.buildDestination.mockReturnValue("campeonatos/c1/reglamento.pdf");
    mockStorage.uploadBuffer.mockResolvedValue(uploaded);
    mockDB.updateItem.mockResolvedValue({ id: "c1", reglamentoUrl: uploaded.publicUrl });

    const result = await repo.setReglamento("c1", file);

    expect(result).toEqual({
      reglamentoUrl: uploaded.publicUrl,
      reglamentoPath: uploaded.storagePath,
    });
    expect(mockStorage.uploadBuffer).toHaveBeenCalledWith(
      file.buffer,
      "campeonatos/c1/reglamento.pdf",
      "application/pdf"
    );
    expect(mockDB.updateItem).toHaveBeenCalledWith("campeonatos", "c1", {
      reglamentoUrl: uploaded.publicUrl,
      reglamentoPath: uploaded.storagePath,
    });
  });

  it("setReglamento elimina el reglamento si el archivo es null", async () => {
    mockDB.getItem.mockResolvedValue({
      id: "c1",
      reglamentoPath: "campeonatos/c1/reglamento.pdf",
    });
    mockStorage.delete.mockResolvedValue();
    mockDB.updateItem.mockResolvedValue({
      id: "c1",
      reglamentoUrl: null,
      reglamentoPath: null,
    });

    const result = await repo.setReglamento("c1", null);

    expect(result).toEqual({ reglamentoUrl: null, reglamentoPath: null });
    expect(mockStorage.delete).toHaveBeenCalledWith("campeonatos/c1/reglamento.pdf");
    expect(mockDB.updateItem).toHaveBeenCalledWith("campeonatos", "c1", {
      reglamentoUrl: null,
      reglamentoPath: null,
    });
  });

  it("setReglamento lanza error si el archivo es inválido", async () => {
    const file = { buffer: null };

    mockDB.getItem.mockResolvedValue({ id: "c1" });

    await expect(repo.setReglamento("c1", file)).rejects.toThrow("Archivo inválido");
  });

  it("setReglamento lanza error si el campeonato no existe", async () => {
    mockDB.getItem.mockResolvedValue(null);

    await expect(repo.setReglamento("c1", null)).rejects.toThrow("Campeonato no encontrado");
  });
});