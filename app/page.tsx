import Link from "next/link";
import styles from "./page.module.css";
import { createProject } from "./actions/project";
import { prisma } from "@/lib/prisma";
import { DeleteProjectButton } from "@/components/Project/DeleteProjectButton";
import { CreateProjectForm } from "@/components/Project/CreateProjectForm";

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

      <CreateProjectForm />

      <div className={styles.grid}>

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
