import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import styles from "./page.module.css";
import Link from "next/link";
import { addSite } from "@/app/actions/site";
import { syncCategories } from "@/app/actions/category";
import { getSettings } from "@/app/actions/settings";
import { ProjectLanguageSelector } from "@/components/ProjectLanguageSelector";

export default async function ProjectPage({ params }: { params: { id: string } }) {
    const resolvedParams = await params;

    // Fetch project
    const project = await prisma.project.findUnique({
        where: { id: resolvedParams.id },
        include: {
            sites: {
                include: {
                    categories: true
                }
            },
            posts: {
                orderBy: { updatedAt: 'desc' }
            }
        }
    });

    if (!project) return notFound();

    // Fetch settings dynamically or statically if needed
    const settings = await getSettings();

    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <div>
                    <Link href="/" style={{ color: 'var(--accent-color)', marginBottom: '0.5rem', display: 'inline-block' }}>
                        &larr; Volver al Dashboard
                    </Link>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', flexWrap: 'wrap' }}>
                        <h1 className="title" style={{ margin: 0 }}>{project.name}</h1>
                        <ProjectLanguageSelector projectId={project.id} currentLanguage={project.language || settings?.language || "Español"} />
                    </div>
                </div>
            </div>

            <div className={styles.grid}>
                {/* SIDEBAR: Sitios WordPress */}
                <div className={styles.sidebar}>
                    <div className="glass-panel">
                        <h2 style={{ fontSize: '1.25rem', marginBottom: '1.5rem' }}>Sitios WordPress</h2>

                        {project.sites.length === 0 ? (
                            <p className={styles.emptyState} style={{ padding: '1rem' }}>No hay sitios conectados.</p>
                        ) : (
                            project.sites.map(site => (
                                <div key={site.id} className={styles.siteCard}>
                                    <div>
                                        <div style={{ fontWeight: '600' }}>{site.name}</div>
                                        <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{site.url}</div>
                                    </div>
                                    <form action={async () => {
                                        "use server";
                                        await syncCategories(site.id, project.id);
                                    }}>
                                        <button type="submit" className="btn-primary" style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem' }}>
                                            Sincronizar ({site.categories?.length || 0} Categorías)
                                        </button>
                                    </form>
                                </div>
                            ))
                        )}

                        <div style={{ marginTop: '2rem', borderTop: '1px solid var(--glass-border)', paddingTop: '1.5rem' }}>
                            <h3 style={{ fontSize: '1rem', marginBottom: '1rem' }}>Agregar Sitio</h3>
                            <form action={addSite}>
                                <input type="hidden" name="projectId" value={project.id} />
                                <div className={styles.formGroup}>
                                    <label className={styles.label}>Nombre</label>
                                    <input type="text" name="name" required className={styles.inputField} placeholder="Mi Blog" />
                                </div>
                                <div className={styles.formGroup}>
                                    <label className={styles.label}>URL de WordPress</label>
                                    <input type="url" name="url" required className={styles.inputField} placeholder="https://miblog.com" />
                                </div>
                                <div className={styles.formGroup}>
                                    <label className={styles.label}>Usuario</label>
                                    <input type="text" name="username" required className={styles.inputField} placeholder="admin" />
                                </div>
                                <div className={styles.formGroup}>
                                    <label className={styles.label}>Password de Aplicación</label>
                                    <input type="password" name="password" required className={styles.inputField} placeholder="xxxx xxxx xxxx xxxx" />
                                </div>
                                <button type="submit" className="btn-primary" style={{ width: '100%', marginTop: '0.5rem' }}>Conectar Sitio</button>
                            </form>
                        </div>
                    </div>
                </div>

                {/* CONTENIDO PRINCIPAL: Publicaciones */}
                <div className={styles.mainContent}>
                    <div className="glass-panel">
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                            <h2 style={{ fontSize: '1.5rem' }}>Publicaciones</h2>
                            <Link href={`/projects/${project.id}/editor`} className="btn-primary">
                                + Crear Contenido
                            </Link>
                        </div>

                        {project.posts.length === 0 ? (
                            <div className={styles.emptyState}>
                                <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📝</div>
                                <h3>Sin publicaciones aún</h3>
                                <p>Crea tu primer contenido usando IA y envíalo a tus sitios.</p>
                            </div>
                        ) : (
                            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                                <thead>
                                    <tr style={{ borderBottom: '1px solid var(--glass-border)', color: 'var(--text-secondary)' }}>
                                        <th style={{ padding: '1rem 0' }}>Título</th>
                                        <th style={{ padding: '1rem 0' }}>Estado</th>
                                        <th style={{ padding: '1rem 0' }}>Actualizado</th>
                                        <th style={{ padding: '1rem 0' }}>Acciones</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {project.posts.map(post => (
                                        <tr key={post.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                                            <td style={{ padding: '1rem 0', fontWeight: '500' }}>{post.title || 'Borrador sin título'}</td>
                                            <td style={{ padding: '1rem 0' }}>
                                                <span style={{
                                                    padding: '0.2rem 0.6rem',
                                                    borderRadius: '12px',
                                                    fontSize: '0.8rem',
                                                    background: post.status === 'published' ? 'rgba(16, 185, 129, 0.2)' : 'rgba(245, 158, 11, 0.2)',
                                                    color: post.status === 'published' ? 'var(--success-color)' : '#f59e0b'
                                                }}>
                                                    {post.status}
                                                </span>
                                            </td>
                                            <td style={{ padding: '1rem 0', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                                                {new Date(post.updatedAt).toLocaleDateString()}
                                            </td>
                                            <td style={{ padding: '1rem 0' }}>
                                                <Link href={`/projects/${project.id}/editor/${post.id}`} style={{ color: 'var(--accent-color)', fontSize: '0.9rem' }}>
                                                    Editar
                                                </Link>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
