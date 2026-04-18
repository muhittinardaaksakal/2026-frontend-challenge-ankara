import React, { useEffect, useMemo } from 'react';
import { CircleMarker, MapContainer, Popup, TileLayer, useMap } from 'react-leaflet';
import { latLngBounds } from 'leaflet';
import 'leaflet/dist/leaflet.css';

const DEFAULT_CENTER = [39.92077, 32.85411];
const DEFAULT_ZOOM = 12;
const SELECTED_ZOOM = 15;
const STACK_OFFSET = 0.00018;

const SOURCE_COLORS = {
  checkins: '#8b5b17',
  messages: '#1f6b88',
  sightings: '#2f6b42',
  notes: '#6a4380',
  tips: '#a03f39',
};

function buildMarkerRecords(records) {
  const groups = new Map();

  records
    .filter((record) => record.coordinates)
    .forEach((record) => {
      const key = `${record.coordinates.lat.toFixed(5)}:${record.coordinates.lng.toFixed(5)}`;
      const currentGroup = groups.get(key) || [];
      currentGroup.push(record);
      groups.set(key, currentGroup);
    });

  return [...groups.values()].flatMap((group) => {
    if (group.length === 1) {
      const [record] = group;

      return [
        {
          record,
          mapLat: record.coordinates.lat,
          mapLng: record.coordinates.lng,
        },
      ];
    }

    return group.map((record, index) => {
      const angle = (Math.PI * 2 * index) / group.length;
      const ringMultiplier = 1 + Math.floor(index / 6) * 0.35;
      const offset = STACK_OFFSET * ringMultiplier;

      return {
        record,
        mapLat: record.coordinates.lat + Math.sin(angle) * offset,
        mapLng: record.coordinates.lng + Math.cos(angle) * offset,
      };
    });
  });
}

function formatPopupTitle(record) {
  return record.person || record.title || record.sourceLabel;
}

function MapViewportController({ markers, selectedRecordId }) {
  const map = useMap();

  useEffect(() => {
    if (!markers.length) {
      return;
    }

    const selectedMarker = markers.find((marker) => marker.record.id === selectedRecordId);

    window.requestAnimationFrame(() => {
      map.invalidateSize();
    });

    if (selectedMarker) {
      map.flyTo([selectedMarker.mapLat, selectedMarker.mapLng], SELECTED_ZOOM, {
        animate: true,
        duration: 0.7,
      });
      return;
    }

    if (markers.length === 1) {
      map.setView([markers[0].mapLat, markers[0].mapLng], DEFAULT_ZOOM + 2);
      return;
    }

    const bounds = latLngBounds(markers.map((marker) => [marker.mapLat, marker.mapLng]));
    map.fitBounds(bounds, {
      padding: [28, 28],
      maxZoom: DEFAULT_ZOOM + 2,
    });
  }, [map, markers, selectedRecordId]);

  return null;
}

export default function MapPanel({ records, selectedRecordId, onSelectRecord }) {
  const markers = useMemo(() => buildMarkerRecords(records), [records]);
  const selectedRecord = useMemo(() => {
    return records.find((record) => record.id === selectedRecordId) ?? null;
  }, [records, selectedRecordId]);

  return (
    <section className="detail-section-block map-panel">
      <div className="detail-section-heading">
        <h3>Map View</h3>
        <span>{markers.length} mapped records</span>
      </div>

      <p className="map-instruction">
        Filtered leads with coordinates appear here. Click a marker to open that record, or select a
        lead from the list to focus the map.
      </p>

      {markers.length > 0 ? (
        <div className="map-shell">
          <MapContainer
            center={DEFAULT_CENTER}
            zoom={DEFAULT_ZOOM}
            scrollWheelZoom={false}
            className="map-canvas"
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />

            <MapViewportController markers={markers} selectedRecordId={selectedRecordId} />

            {markers.map((marker) => {
              const { record } = marker;
              const isSelected = record.id === selectedRecordId;
              const color = SOURCE_COLORS[record.source] || '#8b1e24';

              return (
                <CircleMarker
                  key={record.id}
                  center={[marker.mapLat, marker.mapLng]}
                  radius={isSelected ? 10 : 7}
                  pathOptions={{
                    color: isSelected ? '#67161a' : color,
                    fillColor: color,
                    fillOpacity: isSelected ? 0.95 : 0.78,
                    weight: isSelected ? 3 : 2,
                  }}
                  eventHandlers={{
                    click: () => onSelectRecord?.(record),
                  }}
                >
                  <Popup>
                    <div className="map-popup">
                      <strong>{formatPopupTitle(record)}</strong>
                      <span>{record.sourceLabel}</span>
                      <span>{record.place || 'Unknown place'}</span>
                      <span>{record.createdAt || 'Unknown time'}</span>
                      <p className="map-popup-summary">{record.summary}</p>
                    </div>
                  </Popup>
                </CircleMarker>
              );
            })}
          </MapContainer>
        </div>
      ) : (
        <div className="map-empty">
          <strong>No mapped leads in the current filter set.</strong>
          <p>
            Try widening the search or source filters. Records without coordinate fields stay in the
            list and detail flow, but they are not shown on the map.
          </p>
        </div>
      )}

      <div className="map-meta-row">
        <span>{selectedRecord?.coordinates ? `Selected lead is mapped at ${selectedRecord.coordinates.label}` : 'Selected lead has no map position.'}</span>
        <span>Scroll wheel zoom is disabled to keep the dashboard stable.</span>
      </div>
    </section>
  );
}
