import { MessageSquareMore, Pencil, SendHorizontal, Trash2 } from "lucide-react";

function normalizeRole(role) {
  return String(role || "").trim().toUpperCase().replace(/^ROLE_/, "");
}

function formatRoleLabel(role) {
  const normalized = normalizeRole(role);
  return normalized ? `[${normalized}]` : "";
}

function getInitials(name) {
  const parts = String(name || "")
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2);
  if (parts.length === 0) return "NA";
  return parts.map((part) => part[0].toUpperCase()).join("");
}

function formatCommentTime(value) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleString();
}

export default function CommentSection({ comments, currentUser, draft, onDraft, onPost, onEdit, onDelete, canPost = true, postBlockedMessage = "" }) {
  const list = comments || [];
  const currentUserId = currentUser?.id;
  const currentRole = normalizeRole(currentUser?.role);
  const isAdmin = currentRole === "ADMIN";

  return (
    <div style={{ marginTop: 16 }}>
      <style>{`
        .ticketComments-shell {
          border: 1px solid rgba(148, 163, 184, 0.18);
          border-radius: 18px;
          background: linear-gradient(180deg, rgba(248, 250, 252, 0.96), rgba(255, 255, 255, 0.92));
          overflow: hidden;
        }

        .ticketComments-head {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
          padding: 12px 14px;
          border-bottom: 1px solid rgba(148, 163, 184, 0.14);
          background: rgba(255, 255, 255, 0.72);
        }

        .ticketComments-titleWrap {
          display: flex;
          align-items: center;
          gap: 10px;
          min-width: 0;
        }

        .ticketComments-icon {
          width: 34px;
          height: 34px;
          border-radius: 12px;
          display: grid;
          place-items: center;
          color: #0f766e;
          background: rgba(20, 184, 166, 0.12);
          border: 1px solid rgba(20, 184, 166, 0.16);
          flex-shrink: 0;
        }

        .ticketComments-title {
          margin: 0;
          font-size: 14px;
          font-weight: 800;
          color: #0f172a;
        }

        .ticketComments-subtitle {
          margin: 2px 0 0;
          font-size: 12px;
          color: #64748b;
        }

        .ticketComments-count {
          padding: 6px 10px;
          border-radius: 999px;
          background: rgba(15, 23, 42, 0.06);
          color: #475569;
          font-size: 11px;
          font-weight: 800;
          letter-spacing: 0.05em;
          text-transform: uppercase;
        }

        .ticketComments-list {
          max-height: 260px;
          overflow-y: auto;
          padding: 12px;
          display: grid;
          gap: 10px;
        }

        .ticketComment-empty {
          padding: 18px 6px;
          text-align: center;
          color: #64748b;
          font-size: 13px;
        }

        .ticketComment-card {
          display: grid;
          grid-template-columns: auto 1fr;
          gap: 10px;
          align-items: flex-start;
          padding: 12px;
          border-radius: 16px;
          border: 1px solid rgba(148, 163, 184, 0.14);
          background: rgba(255, 255, 255, 0.84);
        }

        .ticketComment-avatar {
          width: 36px;
          height: 36px;
          border-radius: 12px;
          display: grid;
          place-items: center;
          font-size: 12px;
          font-weight: 800;
          color: #0f766e;
          background: linear-gradient(135deg, rgba(20, 184, 166, 0.12), rgba(14, 165, 233, 0.18));
          border: 1px solid rgba(20, 184, 166, 0.14);
        }

        .ticketComment-main {
          min-width: 0;
        }

        .ticketComment-head {
          display: flex;
          justify-content: space-between;
          gap: 10px;
          flex-wrap: wrap;
          align-items: flex-start;
          margin-bottom: 6px;
        }

        .ticketComment-author {
          font-size: 13px;
          font-weight: 700;
          color: #0f172a;
        }

        .ticketComment-meta {
          margin-top: 2px;
          font-size: 11px;
          color: #64748b;
          display: flex;
          gap: 8px;
          flex-wrap: wrap;
        }

        .ticketComment-role {
          font-weight: 700;
          color: #0f766e;
        }

        .ticketComment-actions {
          display: flex;
          gap: 6px;
          align-items: center;
          flex-shrink: 0;
        }

        .ticketComment-iconBtn {
          width: 30px;
          height: 30px;
          border-radius: 10px;
          border: 1px solid rgba(148, 163, 184, 0.16);
          background: rgba(255, 255, 255, 0.86);
          color: #475569;
          display: grid;
          place-items: center;
          cursor: pointer;
          transition: transform 120ms ease, background 120ms ease, border-color 120ms ease;
        }

        .ticketComment-iconBtn:hover {
          transform: translateY(-1px);
          background: rgba(248, 250, 252, 1);
          border-color: rgba(100, 116, 139, 0.22);
        }

        .ticketComment-iconBtn.danger {
          color: #b91c1c;
          background: rgba(254, 242, 242, 0.92);
          border-color: rgba(248, 113, 113, 0.18);
        }

        .ticketComment-body {
          font-size: 13px;
          color: var(--text);
          line-height: 1.55;
          word-break: break-word;
          white-space: pre-wrap;
        }

        .ticketComments-compose {
          padding: 12px;
          border-top: 1px solid rgba(148, 163, 184, 0.14);
          background: rgba(255, 255, 255, 0.7);
        }

        .ticketComments-composeWrap {
          display: grid;
          grid-template-columns: 1fr auto;
          gap: 10px;
          align-items: center;
        }

        .ticketComments-input {
          min-width: 0;
          min-height: 42px;
          border-radius: 14px;
          padding: 10px 12px;
          font-size: 13px;
        }

        .ticketComments-send {
          min-width: 42px;
          height: 42px;
          padding: 0 14px;
          border-radius: 14px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          font-weight: 800;
        }

        .ticketComments-blocked {
          padding: 12px;
          border-top: 1px solid rgba(148, 163, 184, 0.14);
          color: #64748b;
          font-size: 12px;
          line-height: 1.5;
          background: rgba(255, 255, 255, 0.7);
        }

        @media (max-width: 640px) {
          .ticketComments-composeWrap {
            grid-template-columns: 1fr;
          }

          .ticketComments-send {
            width: 100%;
          }
        }

        :root[data-theme="dark"] .ticketComments-shell {
          background: linear-gradient(180deg, rgba(15, 23, 42, 0.92), rgba(11, 18, 32, 0.98));
          border-color: rgba(148, 163, 184, 0.16);
        }

        :root[data-theme="dark"] .ticketComments-head,
        :root[data-theme="dark"] .ticketComments-compose,
        :root[data-theme="dark"] .ticketComments-blocked,
        :root[data-theme="dark"] .ticketComment-card,
        :root[data-theme="dark"] .ticketComment-iconBtn {
          background: rgba(15, 23, 42, 0.72);
          border-color: rgba(148, 163, 184, 0.14);
        }

        :root[data-theme="dark"] .ticketComments-title,
        :root[data-theme="dark"] .ticketComment-author {
          color: rgba(226, 232, 240, 0.96);
        }

        :root[data-theme="dark"] .ticketComments-subtitle,
        :root[data-theme="dark"] .ticketComments-blocked,
        :root[data-theme="dark"] .ticketComment-meta,
        :root[data-theme="dark"] .ticketComment-empty,
        :root[data-theme="dark"] .ticketComments-count {
          color: rgba(148, 163, 184, 0.9);
        }

        :root[data-theme="dark"] .ticketComments-count {
          background: rgba(148, 163, 184, 0.12);
        }

        :root[data-theme="dark"] .ticketComment-iconBtn {
          color: rgba(226, 232, 240, 0.88);
        }

        :root[data-theme="dark"] .ticketComment-iconBtn.danger {
          color: rgba(254, 202, 202, 0.94);
          background: rgba(127, 29, 29, 0.24);
          border-color: rgba(248, 113, 113, 0.2);
        }
      `}</style>

      <div className="ticketComments-shell">
        <div className="ticketComments-head">
          <div className="ticketComments-titleWrap">
            <div className="ticketComments-icon">
              <MessageSquareMore size={17} />
            </div>
            <div>
              <p className="ticketComments-title">Comments</p>
              <p className="ticketComments-subtitle">Track discussion and updates for this ticket.</p>
            </div>
          </div>
          <span className="ticketComments-count">{list.length} {list.length === 1 ? "comment" : "comments"}</span>
        </div>

        <div className="ticketComments-list">
          {list.length === 0 ? (
            <div className="ticketComment-empty">No comments yet. Start the conversation here.</div>
          ) : (
            list.map((comment) => {
              const authorId = comment?.author?.id;
              const isOwnComment = currentUserId != null && authorId != null && String(currentUserId) === String(authorId);
              const canEdit = Boolean(comment?.canEdit) && (isAdmin || isOwnComment);
              const canDelete = Boolean(comment?.canDelete) && (isAdmin || isOwnComment);

              return (
                <div key={comment.id} className="ticketComment-card">
                  <div className="ticketComment-avatar">{getInitials(comment.author?.name || "Unknown")}</div>
                  <div className="ticketComment-main">
                    <div className="ticketComment-head">
                      <div>
                        <div className="ticketComment-author">{comment.author?.name || "Unknown"}</div>
                        <div className="ticketComment-meta">
                          {formatRoleLabel(comment.author?.role) ? <span className="ticketComment-role">{formatRoleLabel(comment.author?.role)}</span> : null}
                          {formatCommentTime(comment.createdAt || comment.updatedAt)}
                        </div>
                      </div>

                      {canEdit || canDelete ? (
                        <div className="ticketComment-actions">
                          {canEdit ? (
                            <button
                              type="button"
                              className="ticketComment-iconBtn"
                              onClick={() => onEdit(comment)}
                              aria-label="Edit comment"
                              title="Edit comment"
                            >
                              <Pencil size={14} />
                            </button>
                          ) : null}
                          {canDelete ? (
                            <button
                              type="button"
                              className="ticketComment-iconBtn danger"
                              onClick={() => onDelete(comment.id)}
                              aria-label="Delete comment"
                              title="Delete comment"
                            >
                              <Trash2 size={14} />
                            </button>
                          ) : null}
                        </div>
                      ) : null}
                    </div>

                    <div className="ticketComment-body">{comment.content}</div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {canPost ? (
          <div className="ticketComments-compose">
            <div className="ticketComments-composeWrap">
              <input
                className="input ticketComments-input"
                placeholder="Write a comment or update..."
                value={draft || ""}
                onChange={(e) => onDraft(e.target.value)}
              />
              <button type="button" className="btnMini ticketComments-send" onClick={onPost}>
                <SendHorizontal size={15} />
                <span>Post</span>
              </button>
            </div>
          </div>
        ) : (
          <div className="ticketComments-blocked">
            {postBlockedMessage || "Comments are not allowed for this ticket right now."}
          </div>
        )}
      </div>
    </div>
  );
}
