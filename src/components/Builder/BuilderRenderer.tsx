"use client";

import React from 'react';
import { VisualElement, PageLayout, GlobalDesign, AnimationSettings } from '@/services/visuals';
import { motion } from 'framer-motion';
import { Video, Maximize2 } from 'lucide-react';

interface RendererProps {
    elements: VisualElement[];
    onElementClick?: (id: string, key?: string, value?: any) => void;
    selectedId?: string;
    mode?: 'edit' | 'preview';
    viewport?: 'desktop' | 'tablet' | 'mobile';
    globalDesign?: GlobalDesign;
}

export const BuilderRenderer: React.FC<RendererProps> = ({
    elements,
    onElementClick,
    selectedId,
    mode = 'preview',
    viewport = 'desktop',
    globalDesign
}) => {
    // Animation variant generator
    const getAnimationProps = (anim?: AnimationSettings) => {
        if (!anim || anim.type === 'none') return {};

        const variants: any = {
            fade: { opacity: 0 },
            slide: {
                opacity: 0,
                y: anim.direction === 'up' ? 50 : anim.direction === 'down' ? -50 : 0,
                x: anim.direction === 'left' ? 50 : anim.direction === 'right' ? -50 : 0
            },
            zoom: { opacity: 0, scale: 0.8 },
            bounce: { opacity: 0, y: 100 },
            rotate: { opacity: 0, rotate: -45 }
        };

        return {
            initial: variants[anim.type],
            whileInView: { opacity: 1, y: 0, x: 0, scale: 1, rotate: 0 },
            viewport: { once: anim.iteration === 'once' },
            transition: {
                duration: anim.duration || 0.5,
                delay: anim.delay || 0,
                ease: (anim.type === 'bounce' ? [0.175, 0.885, 0.32, 1.275] : "easeOut") as any,
                repeat: anim.iteration === 'infinite' ? Infinity : 0
            }
        };
    };

    const renderElement = (element: VisualElement) => {
        if (element.hidden && mode === 'preview') return null;

        const isSelected = selectedId === element.id;

        // Responsive style selection with fallback to desktop
        const styles = {
            ...(element.styles.desktop || {}),
            ...(viewport === 'tablet' ? element.styles.tablet || {} : {}),
            ...(viewport === 'mobile' ? element.styles.mobile || {} : {}),
        };

        const commonProps = {
            id: element.id,
            style: {
                ...styles,
                position: styles.position || 'relative',
                display: (element.type === 'section' || element.type === 'container') ? 'flex' : (styles.display || 'block'),
            } as React.CSSProperties,
            onClick: (e: React.MouseEvent) => {
                if (mode === 'edit') {
                    e.stopPropagation();
                    onElementClick?.(element.id);
                }
            },
            className: `
                transition-all 
                ${mode === 'edit' ? 'hover:outline hover:outline-2 hover:outline-purple-500/50 cursor-pointer' : ''}
                ${isSelected ? 'outline outline-2 outline-purple-500 z-[999]' : ''}
                ${mode === 'edit' && element.hidden ? 'opacity-30 grayscale-[50%]' : ''}
                ${mode === 'edit' && (element.type === 'section' || element.type === 'container') && (!element.children || element.children.length === 0) ? 'border-2 border-dashed border-white/10 min-h-[100px] min-w-[200px]' : ''}
            `
        };

        const Wrapper = (element.animation && element.animation.type !== 'none') ? motion.div : 'div';
        const animationProps = getAnimationProps(element.animation);

        const content = (() => {
            switch (element.type) {
                case 'section':
                    return (
                        <section {...commonProps} className={`${commonProps.className} w-full min-h-[100px]`}>
                            {element.children?.map(child => (
                                <React.Fragment key={child.id}>
                                    {renderElement(child)}
                                </React.Fragment>
                            ))}
                        </section>
                    );

                case 'container':
                    return (
                        <div {...commonProps} className={`${commonProps.className}`}>
                            {element.children?.map(child => (
                                <React.Fragment key={child.id}>
                                    {renderElement(child)}
                                </React.Fragment>
                            ))}
                        </div>
                    );

                case 'text':
                    const Tag = (element.props.tag || 'p') as any;
                    return (
                        <Tag
                            {...commonProps}
                            contentEditable={mode === 'edit'}
                            suppressContentEditableWarning
                            onBlur={(e: React.FocusEvent<HTMLElement>) => {
                                if (mode === 'edit') {
                                    (onElementClick as any)?.(element.id, 'content', e.currentTarget.innerText);
                                }
                            }}
                        >
                            {element.props.content || 'Sample Text'}
                        </Tag>
                    );

                case 'image':
                    return (
                        <img
                            src={element.props.url || 'https://via.placeholder.com/150'}
                            alt={element.props.alt || ''}
                            {...commonProps}
                        />
                    );

                case 'button':
                    return (
                        <button {...commonProps} className={`${commonProps.className} px-6 py-3 font-bold uppercase transition-all`}>
                            {element.props.label || 'Button'}
                        </button>
                    );

                case 'video':
                    return (
                        <div {...commonProps} className={`${commonProps.className} overflow-hidden bg-black flex items-center justify-center`}>
                            {element.props.url ? (
                                <iframe
                                    src={element.props.url.includes('youtube.com') ? element.props.url.replace('watch?v=', 'embed/') : element.props.url}
                                    className="w-full h-full border-none"
                                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                    allowFullScreen
                                />
                            ) : (
                                <div className="flex flex-col items-center gap-2 text-gray-500">
                                    <Video size={32} />
                                    <span className="text-[10px] font-bold uppercase tracking-widest">Video Placeholder</span>
                                </div>
                            )}
                        </div>
                    );

                case 'spacer':
                    return (
                        <div {...commonProps} className={`${commonProps.className} flex-shrink-0`} style={{ ...commonProps.style, minHeight: styles.height || '50px' }}>
                            {mode === 'edit' && (
                                <div className="w-full h-full border border-white/5 bg-white/5 flex items-center justify-center">
                                    <Maximize2 size={16} className="text-gray-700 opacity-30" />
                                </div>
                            )}
                        </div>
                    );

                case 'divider':
                    return (
                        <div {...commonProps} className={`${commonProps.className} flex items-center py-4`}>
                            <div className="w-full border-t border-white/10" style={{ borderColor: styles.color || 'rgba(255,255,255,0.1)', borderWidth: styles.borderWidth || '1px' }} />
                        </div>
                    );

                case 'dynamic':
                    // For complex blocks like ProductGrid, we can map to actual components
                    return (
                        <div {...commonProps}>
                            [Dynamic Block: {element.label}]
                        </div>
                    );

                    return null;
            }
        })();

        if (element.type === 'section') return content; // Sections don't need motion wrappers for layout reasons, but could be added if needed

        return (
            <Wrapper {...(Wrapper === motion.div ? animationProps : {})} className="contents">
                {content}
            </Wrapper>
        );
    };

    const globalStyles = globalDesign ? {
        '--primary': globalDesign.colors.primary,
        '--secondary': globalDesign.colors.secondary,
        '--accent': globalDesign.colors.accent,
        '--bg-master': globalDesign.colors.background,
        '--surface-master': globalDesign.colors.surface,
        '--font-display': globalDesign.typography.display,
        '--font-body': globalDesign.typography.body,
    } as React.CSSProperties : {};

    return (
        <div className="w-full h-full min-h-screen" style={globalStyles}>
            {elements.map(el => (
                <React.Fragment key={el.id}>
                    {renderElement(el)}
                </React.Fragment>
            ))}
        </div>
    );
};
