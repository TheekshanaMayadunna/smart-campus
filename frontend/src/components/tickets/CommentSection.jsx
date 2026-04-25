export default function CommentSection({ comments, currentUser, draft, onDraft, onPost, onEdit, onDelete }) {
  const list = comments || [];

  return (
    <div style={{ marginTop: 10 }}>
      <strong style={{ fontSize: 13, display: "block", marginBottom: 6 }}>Comments</strong>

      <div
        style={{
          maxHeight: 180,
          overflowY: "auto",
          overflowX: "hidden",
          padding: "4px 6px 4px 8px",
          marginBottom: 6,
          border: "1px solid #e5e7eb",
          borderRadius: 8,
          background: "#fff",
          display: "flex",
          flexDirection: "column",
        }}
      >
        {list.length === 0 ? (
          <div style={{ fontSize: 12, color: "#94a3b8", padding: "2px 0 4px" }}>No comments yet.</div>
        ) : (
          list.map((comment, index) => {
            const currentUserId = currentUser?.id == null ? null : String(currentUser.id);
            const commentAuthorId = comment.author?.id == null ? null : String(comment.author.id);
            const currentUserEmail = currentUser?.email == null ? null : String(currentUser.email).toLowerCase();
            const commentAuthorEmail = comment.author?.email == null ? null : String(comment.author.email).toLowerCase();
            const isOwnerById = currentUserId !== null && currentUserId === commentAuthorId;
            const isOwnerByEmail = currentUserEmail !== null && currentUserEmail === commentAuthorEmail;
            const canModify = isOwnerById || isOwnerByEmail;
            const isLast = index === list.length - 1;
            return (
              <div
                key={comment.id}
                style={{
                  padding: "5px 0 6px",
                  borderBottom: isLast ? "none" : "1px solid #f1f5f9",
                  flexShrink: 0,
                }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    gap: 8,
                    flexWrap: "wrap",
                    marginBottom: 1,
                  }}
                >
                  <span style={{ fontSize: 11, fontWeight: 600, color: "#64748b" }}>
                    {comment.author?.name || "Unknown"}
                  </span>
                  {canModify ? (
                    <div style={{ display: "flex", gap: 6 }}>
                      <button type="button" className="btnMini" style={{ padding: "2px 8px", fontSize: 11 }} onClick={() => onEdit(comment)}>
                        Edit
                      </button>
                      <button type="button" className="btnMini danger" style={{ padding: "2px 8px", fontSize: 11 }} onClick={() => onDelete(comment.id)}>
                        Delete
                      </button>
                    </div>
                  ) : null}
                </div>
                <div style={{ fontSize: 13, color: "#0f172a", lineHeight: 1.35, wordBreak: "break-word" }}>{comment.content}</div>
              </div>
            );
          })
        )}
      </div>

      <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
        <input
          className="input"
          placeholder="Add comment..."
          value={draft || ""}
          onChange={(e) => onDraft(e.target.value)}
          style={{
            flex: 1,
            minWidth: 0,
            padding: "6px 10px",
            borderRadius: 8,
            fontSize: 13,
            minHeight: 34,
            maxHeight: 72,
          }}
        />
        <button type="button" className="btnMini" style={{ flexShrink: 0, padding: "6px 12px", fontSize: 13 }} onClick={onPost}>
          Post
        </button>
      </div>
    </div>
  );
}
