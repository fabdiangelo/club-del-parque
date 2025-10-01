export default function UserModal({ users, isOpen, onClose, onSelectUser }) {
  return (
    <>
      <input
        type="checkbox"
        id="user-modal"
        className="modal-toggle"
        checked={isOpen}
        onChange={onClose}
      />

      <div className="modal">
        <div className="modal-box w-[400px] max-h-[500px] rounded-lg bg-white">

          <ul className="space-y-2 overflow-y-auto max-h-[400px]">
            {users.map((user) => (
              <li
                key={user.id}
                className="p-3 rounded-md bg-gray-100 hover:bg-blue-100 cursor-pointer transition text-black"
                onClick={() => {
                  onSelectUser(user); 
                  onClose();      
                }}
              >
                {user.name} - {user.email}
              </li>
            ))}
          </ul>

          <div className="modal-action">
            <button className="btn" onClick={onClose}>Cerrar</button>
          </div>
        </div>
      </div>
    </>
  );
}
