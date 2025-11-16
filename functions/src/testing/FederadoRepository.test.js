import { describe, it, expect, vi, beforeEach } from "vitest";
import { FederadoRepository } from "../infraestructure/adapters/FederadoRepository.js";
import DBConnection from "../infraestructure/ports/DBConnection.js";

vi.mock("../infraestructure/ports/DBConnection.js", () => {
  return {
    default: class {
      constructor() {
        this.getItem = vi.fn();
        this.findOne = vi.fn();
        this.findMany = vi.fn();
        this.getAllItems = vi.fn();
        this.putItem = vi.fn();
        this.updateItem = vi.fn();
        this.count = vi.fn();
      }
    },
  };
});

describe("FederadoRepository - Métodos esenciales", () => {
  let repo;
  let mockDB;

  beforeEach(() => {
    mockDB = new DBConnection();
    repo = new FederadoRepository();
    repo.db = mockDB;
  });

  it("getAllFederados devuelve todos los federados ordenados", async () => {
  const federados = [
    { id: "f1", nombre: "Juan", apellido: "Pérez" },
    { id: "f2", nombre: "Ana", apellido: "García" },
  ];

  mockDB.findMany.mockResolvedValue(federados);
  mockDB.getAllItems.mockResolvedValue(federados);

  const result = await repo.getAllFederados();

  expect(result).toEqual([
    {
      id: "f2",
      uid: null,
      email: null,
      nombre: "Ana",
      apellido: "García",
      genero: null,
      estado: null,
      rol: "federado",
      ...federados[1],
    },
    {
      id: "f1",
      uid: null,
      email: null,
      nombre: "Juan",
      apellido: "Pérez",
      genero: null,
      estado: null,
      rol: "federado",
      ...federados[0],
    },
  ]);

  expect(mockDB.findMany).toHaveBeenCalledWith("federados", {});
});
  it("getFederadoById devuelve un federado por ID", async () => {
    const federado = { id: "f1", nombre: "Juan", apellido: "Pérez" };
    mockDB.getItem.mockResolvedValue(federado);

    const result = await repo.getFederadoById("f1");

    expect(result).toEqual({
      id: "f1",
      uid: null,
      email: null,
      nombre: "Juan",
      apellido: "Pérez",
      genero: null,
      estado: null,
      rol: "federado",
      ...federado,
    });
    expect(mockDB.getItem).toHaveBeenCalledWith("federados", "f1");
  });

  it("getFederadoById devuelve null si el federado no existe", async () => {
    mockDB.getItem.mockResolvedValue(null);

    const result = await repo.getFederadoById("f1");

    expect(result).toBeNull();
    expect(mockDB.getItem).toHaveBeenCalledWith("federados", "f1");
  });

  it("exists devuelve true si el federado existe", async () => {
    mockDB.getItem.mockResolvedValue({ id: "f1" });

    const result = await repo.exists("f1");

    expect(result).toBe(true);
    expect(mockDB.getItem).toHaveBeenCalledWith("federados", "f1");
  });

  it("exists devuelve false si el federado no existe", async () => {
    mockDB.getItem.mockResolvedValue(null);

    const result = await repo.exists("f1");

    expect(result).toBe(false);
    expect(mockDB.getItem).toHaveBeenCalledWith("federados", "f1");
  });

  it("findByUid devuelve un federado por UID", async () => {
    const federado = { id: "f1", uid: "u1", nombre: "Juan" };
    mockDB.findOne.mockResolvedValue(federado);

    const result = await repo.findByUid("u1");

    expect(result).toEqual({
      id: "f1",
      uid: "u1",
      email: null,
      nombre: "Juan",
      apellido: "",
      genero: null,
      estado: null,
      rol: "federado",
      ...federado,
    });
    expect(mockDB.findOne).toHaveBeenCalledWith("federados", { uid: "u1" });
  });




  it("create lanza error si el federado ya existe", async () => {
    mockDB.getItem.mockResolvedValue({ id: "f1" });

    await expect(repo.create("f1", { nombre: "Juan" })).rejects.toThrow(
      "El federado ya existe"
    );
    expect(mockDB.getItem).toHaveBeenCalledWith("federados", "f1");
  });

  it("create crea un nuevo federado", async () => {
    mockDB.getItem.mockResolvedValue(null);
    mockDB.putItem.mockResolvedValue();

    const result = await repo.create("f1", { nombre: "Juan" });

    expect(result).toBe("f1");
    expect(mockDB.putItem).toHaveBeenCalledWith(
      "federados",
      { nombre: "Juan", rol: "federado" },
      "f1"
    );
  });

  it("upsert actualiza o crea un federado", async () => {
    mockDB.putItem.mockResolvedValue();

    const result = await repo.upsert("f1", { nombre: "Juan" });

    expect(result).toBe("f1");
    expect(mockDB.putItem).toHaveBeenCalledWith(
      "federados",
      { nombre: "Juan", rol: "federado" },
      "f1"
    );
  });

  it("update actualiza un federado existente", async () => {
    mockDB.updateItem.mockResolvedValue();

    const result = await repo.update("f1", { nombre: "Juan" });

    expect(result).toBeUndefined();
    expect(mockDB.updateItem).toHaveBeenCalledWith("federados", "f1", {
      nombre: "Juan",
    });
  });

  it("setCategoria actualiza la categoría de un federado", async () => {
    mockDB.updateItem.mockResolvedValue();

    const result = await repo.setCategoria("f1", "cat1");

    expect(result).toEqual({ id: "f1", categoriaId: "cat1" });
    expect(mockDB.updateItem).toHaveBeenCalledWith("federados", "f1", {
      categoriaId: "cat1",
    });
  });

  it("removeCategoria elimina la categoría de un federado", async () => {
    mockDB.updateItem.mockResolvedValue();

    const result = await repo.removeCategoria("f1");

    expect(result).toEqual({ id: "f1", categoriaId: null });
    expect(mockDB.updateItem).toHaveBeenCalledWith("federados", "f1", {
      categoriaId: null,
    });
  });

  it("agregarSubscripcion agrega una subscripción al federado", async () => {
    const federado = { id: "f1", subscripcionesIDs: ["sub1"] };
    mockDB.getItem.mockResolvedValue(federado);
    mockDB.putItem.mockResolvedValue();

    await repo.agregarSubscripcion("f1", "sub2");

    expect(mockDB.putItem).toHaveBeenCalledWith("federados", {
      ...federado,
      subscripcionesIDs: ["sub2", "sub1"],
    }, "f1");
  });
});