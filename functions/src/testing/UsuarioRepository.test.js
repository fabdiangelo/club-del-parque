import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("../infraestructure/ports/DBConnection.js", () => {
  return {
    default: vi.fn().mockImplementation(function () {
      return {
        getAllItems: vi.fn(),
        getItem: vi.fn(),
        updateItem: vi.fn(),
        putItem: vi.fn(),
        deleteItem: vi.fn(),
        cantItems: vi.fn(),
        getItemsByField: vi.fn(),
      };
    }),
  };
});

vi.mock("../infraestructure/ports/AuthConnection.js", () => {
  return {
    default: vi.fn().mockImplementation(function () {
      return {
        updateUser: vi.fn(),
      };
    }),
  };
});

import DBConnection from "../infraestructure/ports/DBConnection.js";
import AuthConnection from "../infraestructure/ports/AuthConnection.js";
import { UsuarioRepository } from "../infraestructure/adapters/UsuarioRepository.js";

describe("Usuario Repository", () => {
  let repo;
  let mockDB;
  let mockAuth;

  beforeEach(() => {
    mockDB = new DBConnection();
    mockAuth = new AuthConnection();

    repo = new UsuarioRepository();
    repo.db = mockDB;
    repo.auth = mockAuth;
  });


  it("debe obtener un usuario por ID", async () => {
    mockDB.getItem.mockResolvedValueOnce({
      id: "1",
      nombre: "Alan",
    });

    const result = await repo.getUserById("1");

    expect(mockDB.getItem).toHaveBeenCalledWith("usuarios", "1");
    expect(result).toEqual({ id: "1", nombre: "Alan" });
  });


  it("debe devolver todos los usuarios en formato array", async () => {
    const fakeSnapshot = [
      { id: "1", data: () => ({ nombre: "Alan" }) },
      { id: "2", data: () => ({ nombre: "Bruno" }) },
    ];

    mockDB.getAllItems.mockResolvedValueOnce(fakeSnapshot);

    const result = await repo.getAllUsers();

    expect(result).toEqual([
      { id: "1", nombre: "Alan" },
      { id: "2", nombre: "Bruno" },
    ]);
  });


  it("debe obtener solo usuarios con rol usuario", async () => {
    const fakeUsers = [{ id: "1", rol: "usuario" }];

    mockDB.getItemsByField.mockResolvedValueOnce(fakeUsers);

    const result = await repo.getOnlyUsers();

    expect(mockDB.getItemsByField).toHaveBeenCalledWith(
      "usuarios",
      "rol",
      "usuario"
    );
    expect(result).toEqual(fakeUsers);
  });


  it("update debe actualizar DB y llamar a Auth cuando cambia email y password", async () => {
    const usuario = {
      email: "nuevo@mail.com",
      password: "12345",
    };

    await repo.update("12", usuario);

    expect(mockDB.updateItem).toHaveBeenCalledWith("usuarios", "12", usuario);

    expect(mockAuth.updateUser).toHaveBeenCalledTimes(2);
    expect(mockAuth.updateUser).toHaveBeenCalledWith("12", { email: "nuevo@mail.com" });
    expect(mockAuth.updateUser).toHaveBeenCalledWith("12", { password: "12345" });
  });


  it("debe devolver cantidad de usuarios", async () => {
    mockDB.cantItems.mockResolvedValueOnce(7);

    const result = await repo.getCantUsuarios();

    expect(result).toBe(7);
  });


  it("debe obtener notiTokens del usuario", async () => {
    mockDB.getItem.mockResolvedValueOnce({
      id: "9",
      notiTokens: ["abc", "123"],
    });

    const result = await repo.getNotiTokensById("9");

    expect(result).toEqual(["abc", "123"]);
  });

  it("si el usuario no existe, devuelve array vacío", async () => {
    mockDB.getItem.mockResolvedValueOnce(null);

    const result = await repo.getNotiTokensById("33");

    expect(result).toEqual([]);
  });


  it("agrega token a usuarios si existe", async () => {
    mockDB.getItem.mockResolvedValueOnce({
      id: "10",
      notiTokens: ["aaa"],
    });

    mockDB.getItem.mockResolvedValueOnce(null);

    await repo.agregarNotiToken("10", "bbb");

    expect(mockDB.updateItem).toHaveBeenCalledWith("usuarios", "10", {
      notiTokens: ["aaa", "bbb"],
    });
  });

  it("agrega token a administradores si el usuario NO existe", async () => {
    mockDB.getItem.mockResolvedValueOnce(null);

    mockDB.getItem.mockResolvedValueOnce({
      id: "10",
      notiTokens: ["tok1"],
    });

    await repo.agregarNotiToken("10", "tok2");

    expect(mockDB.updateItem).toHaveBeenCalledWith("administradores", "10", {
      notiTokens: ["tok1", "tok2"],
    });
  });

});
