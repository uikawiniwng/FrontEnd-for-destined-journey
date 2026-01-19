import OpenSeadragon from 'openseadragon';
import { FC, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { DrawStroke, useCanvasDraw } from '../../core/hooks/use-canvas-draw';
import { parseWorldLocation } from '../../core/utils/parse-world-location';
import { resolveMapFocus } from '../../core/utils/resolve-map-focus';
import { withMvuData, WithMvuDataProps } from '../../shared/hoc';
import type { MapMarker } from './data/map-markers';
import type { MapPositionIndex } from './data/map-position-index';
import { mapSourceList } from './data/map-source-list';
import { mapSources } from './data/map-sources';
import styles from './MapTab.module.scss';

const MapTabContent: FC<WithMvuDataProps> = ({ data }) => {
  const [drawMode, setDrawMode] = useState(false);
  const [drawStrokes, setDrawStrokes] = useState<DrawStroke[]>([]);
  const [mapSourceKey, setMapSourceKey] = useState<'small' | 'large'>('small');
  const [mapData, setMapData] = useState<{
    markers: MapMarker[];
    positionIndex: MapPositionIndex;
  } | null>(null);
  const [mapDataError, setMapDataError] = useState<string | null>(null);
  const inlineContainerRef = useRef<HTMLDivElement | null>(null);
  const inlineCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const viewerRef = useRef<OpenSeadragon.Viewer | null>(null);

  const mapPointFromEvent = useCallback(
    (event: React.PointerEvent<HTMLCanvasElement>, canvas: HTMLCanvasElement) => {
      const viewer = viewerRef.current;
      if (!viewer) return null;
      const imageItem = viewer.world.getItemAt(0);
      if (!imageItem) return null;
      const rect = canvas.getBoundingClientRect();
      if (rect.width === 0 || rect.height === 0) return null;
      const viewerPoint = new OpenSeadragon.Point(
        event.clientX - rect.left,
        event.clientY - rect.top,
      );
      const imagePoint = viewer.viewport.viewerElementToImageCoordinates(viewerPoint);
      const size = imageItem.getContentSize();
      if (!size.x || !size.y) return null;
      return {
        nx: imagePoint.x / size.x,
        ny: imagePoint.y / size.y,
      };
    },
    [],
  );

  const mapPointToCanvas = useCallback(
    (point: { nx: number; ny: number }, canvas: HTMLCanvasElement) => {
      const viewer = viewerRef.current;
      if (!viewer) return null;
      const imageItem = viewer.world.getItemAt(0);
      if (!imageItem) return null;
      const size = imageItem.getContentSize();
      if (!size.x || !size.y) return null;
      const imagePoint = new OpenSeadragon.Point(point.nx * size.x, point.ny * size.y);
      const viewerPoint = viewer.viewport.imageToViewerElementCoordinates(imagePoint);
      const rect = canvas.getBoundingClientRect();
      if (rect.width === 0 || rect.height === 0) return null;
      return { x: viewerPoint.x, y: viewerPoint.y };
    },
    [],
  );

  const inlineDraw = useCanvasDraw({
    enabled: drawMode,
    containerRef: inlineContainerRef,
    canvasRef: inlineCanvasRef,
    initialStrokes: drawStrokes,
    onChange: setDrawStrokes,
    mapPointFromEvent,
    mapPointToCanvas,
  });

  const { resizeCanvas, redraw } = inlineDraw;

  const mapDataUrl = useMemo(() => {
    return `https://testingcf.jsdelivr.net/gh/The-poem-of-destiny/FrontEnd-for-destined-journey@${__APP_VERSION__}/public/assets/map/mapData.json`;
  }, []);

  const worldLocation = useMemo(() => {
    return data.世界?.地点 ?? '未知';
  }, [data.世界?.地点]);

  const locationPath = useMemo(() => {
    return parseWorldLocation(worldLocation);
  }, [worldLocation]);

  useEffect(() => {
    try {
      const variables = getVariables({ type: 'chat' });
      const savedStrokes = _.get(variables, 'map_drawings', []);
      if (Array.isArray(savedStrokes)) {
        setDrawStrokes(savedStrokes as DrawStroke[]);
      }
    } catch (error) {
      console.error('[StatusMap] 读取地图涂画失败:', error);
    }
  }, []);

  useEffect(() => {
    let isActive = true;
    const loadMapData = async () => {
      try {
        setMapDataError(null);
        const response = await fetch(mapDataUrl, { cache: 'no-store' });
        if (!response.ok) {
          throw new Error(`地图数据加载失败: ${response.status}`);
        }
        const json = (await response.json()) as {
          markers: MapMarker[];
          positionIndex: MapPositionIndex;
        };
        if (!isActive) return;
        setMapData(json);
      } catch (error) {
        if (!isActive) return;
        const message = error instanceof Error ? error.message : '地图数据加载失败';
        console.error('[StatusMap] 读取地图标记失败:', error);
        setMapDataError(message);
      }
    };

    loadMapData();
    return () => {
      isActive = false;
    };
  }, [mapDataUrl]);

  const activeMapSource = useMemo(() => {
    return mapSourceList.find(source => source.key === mapSourceKey) ?? mapSourceList[0];
  }, [mapSourceKey]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      try {
        insertOrAssignVariables({ map_drawings: drawStrokes }, { type: 'chat' });
      } catch (error) {
        console.error('[StatusMap] 保存地图涂画失败:', error);
      }
    }, 300);

    return () => window.clearTimeout(timer);
  }, [drawStrokes]);

  useEffect(() => {
    if (!inlineContainerRef.current) return;

    const viewer = OpenSeadragon({
      element: inlineContainerRef.current,
      tileSources: mapSourceKey === 'large' ? mapSources.large : mapSources.small,
      prefixUrl: 'https://openseadragon.github.io/openseadragon/images/',
      showNavigator: true,
      showNavigationControl: true,
      showFullPageControl: false,
      visibilityRatio: 1,
      constrainDuringPan: true,
      crossOriginPolicy: 'Anonymous',
      gestureSettingsMouse: {
        clickToZoom: false,
        dblClickToZoom: true,
        dragToPan: true,
        scrollToZoom: true,
      },
      gestureSettingsTouch: {
        pinchToZoom: true,
        dragToPan: true,
      },
    });

    viewerRef.current = viewer;

    const updateDrawLayerTransform = () => {
      redraw();
    };

    viewer.addHandler('open', () => {
      resizeCanvas();
      updateDrawLayerTransform();
    });

    viewer.addHandler('animation', updateDrawLayerTransform);
    viewer.addHandler('resize', updateDrawLayerTransform);

    return () => {
      viewerRef.current = null;
      viewer.destroy();
    };
  }, [mapSourceKey, resizeCanvas, redraw]);

  useEffect(() => {
    const viewer = viewerRef.current;
    if (!viewer || !mapData) return;

    viewer.clearOverlays();
    mapData.markers.forEach(marker => {
      const markerElement = document.createElement('div');
      markerElement.className = styles.mapMarker;

      const dot = document.createElement('span');
      dot.className = styles.mapMarkerDot;
      markerElement.appendChild(dot);

      const card = document.createElement('div');
      card.className = styles.mapMarkerCard;
      card.innerHTML = `
        <div class="${styles.mapMarkerTitle}">${marker.name}</div>
        ${marker.summary ? `<div class="${styles.mapMarkerSummary}">${marker.summary}</div>` : ''}
        ${marker.imageUrl ? `<img class="${styles.mapMarkerImage}" src="${marker.imageUrl}" />` : ''}
      `;
      markerElement.appendChild(card);

      viewer.addOverlay({
        element: markerElement,
        location: new OpenSeadragon.Point(marker.position.nx, marker.position.ny),
      });
    });
  }, [mapData]);

  useEffect(() => {
    const viewer = viewerRef.current;
    if (!viewer || !mapData) return;
    const focus = resolveMapFocus(mapData.positionIndex, locationPath);
    if (focus.focusPoint) {
      viewer.viewport.panTo(
        new OpenSeadragon.Point(focus.focusPoint.nx, focus.focusPoint.ny),
        true,
      );
      return;
    }
    if (focus.focusBounds) {
      viewer.viewport.fitBounds(
        new OpenSeadragon.Rect(
          focus.focusBounds.x,
          focus.focusBounds.y,
          focus.focusBounds.width,
          focus.focusBounds.height,
        ),
        true,
      );
      return;
    }
    viewer.viewport.goHome(true);
  }, [locationPath, mapData]);

  return (
    <div className={styles.mapTab}>
      <div className={styles.mapContent}>
        <div className={styles.toolbar}>
          <div className={styles.sourceText}>地图类型：{activeMapSource?.name ?? '未知'}</div>
          {mapDataError && <div className={styles.sourceText}>地图数据加载失败</div>}
          <div className={styles.toolbarActions}>
            <div className={styles.sourceActions}>
              {mapSourceList.map(source => (
                <button
                  key={source.key}
                  className={`${styles.sourceButton} ${mapSourceKey === source.key ? styles.sourceButtonActive : ''}`}
                  onClick={() => setMapSourceKey(source.key)}
                  type="button"
                >
                  {source.name}
                </button>
              ))}
            </div>
            <button
              className={`${styles.drawToggle} ${drawMode ? styles.drawToggleActive : ''}`}
              onClick={() => setDrawMode(prev => !prev)}
              type="button"
            >
              {drawMode ? '退出绘制' : '进入绘制'}
            </button>
            {drawMode && (
              <button className={styles.clearButton} onClick={inlineDraw.clearCanvas} type="button">
                清空涂画
              </button>
            )}
          </div>
        </div>
        <div className={styles.mapFrame}>
          <div ref={inlineContainerRef} className={styles.mapViewer} />
          <div
            className={`${styles.drawLayer} ${drawMode ? styles.drawLayerActive : ''} ${!drawMode ? styles.drawLayerDisabled : ''}`}
          >
            <canvas
              ref={inlineCanvasRef}
              className={`${styles.drawCanvas} ${!drawMode ? styles.drawCanvasDisabled : ''}`}
              onPointerDown={inlineDraw.handlePointerDown}
              onPointerMove={inlineDraw.handlePointerMove}
              onPointerUp={inlineDraw.handlePointerUp}
              onPointerLeave={inlineDraw.handlePointerLeave}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export const MapTab = withMvuData({ baseClassName: styles.mapTab })(MapTabContent);
