import Link from "next/link";
import styles from "./page.module.css";
import { createProject } from "./actions/project";
import { prisma } from "@/lib/prisma";
import { DeleteProjectButton } from "@/components/Project/DeleteProjectButton";

export default async function Home() {
  const projects = await prisma.project.findMany({
    orderBy: { updatedAt: 'desc' },
    include: {
      sites: true,
      posts: true,
    }
  });

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div>
          <h1 className="title">Select Project</h1>
          <p className={styles.subtitle}>Manage your WordPress sites and generate content.</p>
        </div>
      </div>

      <div className={styles.grid}>
        <form action={createProject} className={`glass-panel ${styles.projectCard} ${styles.createCard}`} style={{ width: '100%', display: 'flex', flexDirection: 'column', padding: '1.5rem', justifyContent: 'center', alignItems: 'center' }}>
          <div style={{ marginBottom: '1rem', fontWeight: 'bold', fontSize: '1.1rem' }}>✚ Crear Nuevo Proyecto</div>
          <input
            type="text"
            name="name"
            placeholder="Nombre del proyecto..."
            required
            style={{
              marginBottom: '1rem',
              padding: '0.75rem',
              background: 'rgba(15, 23, 42, 0.6)',
              border: '1px solid var(--glass-border)',
              borderRadius: '8px',
              color: 'var(--text-primary)',
              width: '100%',
              outline: 'none'
            }}
          />
          <button type="submit" className="btn-primary" style={{ width: '100%' }}>
            Crear Proyecto
          </button>
        </form>

        {projects.map(project => (
          <Link href={`/projects/${project.id}`} key={project.id} className={`glass-panel ${styles.projectCard}`} style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
            <div>
              <div className={styles.projectName}>{project.name}</div>
              <div className={styles.projectMeta}>
                Updated {new Date(project.updatedAt).toLocaleDateString()}
              </div>
            </div>
            <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem', alignItems: 'center' }}>
              <div className={styles.projectMeta}>
                <span style={{ color: 'var(--text-primary)' }}>{project.sites.length}</span> Sites
              </div>
              <div className={styles.projectMeta}>
                <span style={{ color: 'var(--text-primary)' }}>{project.posts.length}</span> Posts
              </div>
              <DeleteProjectButton projectId={project.id} projectName={project.name} />
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
