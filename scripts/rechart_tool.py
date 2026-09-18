#!/usr/bin/env python3
"""
Piano Community - Rechart and Humanizer Tool
Procesa y equilibra mapas de notas antes de subirlos a GitHub Releases.
- Evita repeticiones monotonas en el mismo carril (maximo 2 notas consecutivas).
- Reemplaza el ping-pong instrumental monotono (0-2-0-2) con 8 patrones musicales variados.
- Previene colisiones con notas hold (ninguna tecla puede aparecer en un carril mientras se sostiene una nota larga).
- Adapta melodias vocales monotonas a curvas ergonomicas naturales para ambas manos.
"""

import sys
import os
import json
import argparse

def humanize_beatmap_data(chart_data):
    bpm = float(chart_data.get('bpm', 120))
    beat_ms = (60000.0 / bpm) if bpm > 0 else 500.0
    
    notes = chart_data.get('notes', [])
    if not notes:
        return chart_data
        
    parsed = []
    for idx, n in enumerate(notes):
        raw_t = n.get('timestamp_ms', n.get('timeMs', n.get('timestamp', n.get('time', 0))))
        t = float(raw_t)
        if t > 0 and t < 100 and ('time' in n or 'timeSec' in n):
            t = round(t * 1000)
        t = int(round(t))
        
        raw_dur = n.get('duration_ms', n.get('holdDuration', n.get('duration', 0)))
        dur = float(raw_dur)
        if dur > 0 and dur < 50 and ('duration' in n or 'holdDuration' in n):
            dur = round(dur * 1000)
        dur = int(round(dur))
        
        lane = int(n.get('lane', n.get('column', n.get('track', 0))))
        lane = max(0, min(2, lane))
        
        is_hold = n.get('type') in ('hold', 'long') or dur > 180
        ty = 'hold' if is_hold else (n.get('type') if n.get('type') in ('swipe', 'slide') else 'tap')
        direction = n.get('direction', n.get('swipeDirection', 'up'))
        is_inst = bool(n.get('isInstrumental', n.get('is_instrumental', False)))
        
        parsed.append({
            'orig_idx': idx,
            't': t,
            'dur': dur,
            'lane': lane,
            'type': ty,
            'direction': direction,
            'isInst': is_inst,
            'pitch': n.get('pitch'),
            'lyric': n.get('lyric', '')
        })
        
    parsed.sort(key=lambda x: x['t'])
    
    lane_counts = [0, 0, 0]
    for n in parsed:
        if 0 <= n['lane'] <= 2:
            lane_counts[n['lane']] += 1
    total = len(parsed)
    is_heavily_skewed = any(c / total > 0.55 for c in lane_counts) if total > 0 else False
    
    inst_patterns = [
        [0, 1, 2, 1],
        [2, 1, 0, 1],
        [0, 2, 1, 2],
        [2, 0, 1, 0],
        [0, 0, 1, 2],
        [2, 2, 1, 0],
        [1, 0, 1, 2],
        [1, 2, 1, 0]
    ]
    
    melody_lane = 1
    melody_dir = 1
    lane_occupied_until = [0, 0, 0]
    recent_lanes = []
    
    final_notes = []
    
    for i, n in enumerate(parsed):
        t = n['t']
        dur = n['dur']
        ty = n['type']
        target_lane = n['lane']
        
        if n['isInst']:
            pattern_grp = (t // int(beat_ms * 4)) % len(inst_patterns)
            step = (t // int(max(100, beat_ms / 2))) % 4
            target_lane = inst_patterns[pattern_grp][step]
        elif is_heavily_skewed:
            pitch = n.get('pitch')
            if pitch is not None and isinstance(pitch, (int, float)) and pitch > 0:
                if pitch < 56: target_lane = 0
                elif pitch > 66: target_lane = 2
                else: target_lane = 1
            else:
                if i % 4 == 0:
                    melody_dir = -melody_dir
                next_l = melody_lane + melody_dir
                if next_l > 2:
                    melody_lane = 1
                    melody_dir = -1
                elif next_l < 0:
                    melody_lane = 1
                    melody_dir = 1
                else:
                    melody_lane = next_l
                target_lane = melody_lane
                
        if lane_occupied_until[target_lane] > t:
            free_lanes = [l for l in [0, 1, 2] if lane_occupied_until[l] <= t]
            if free_lanes:
                free_lanes.sort(key=lambda l: abs(l - target_lane))
                target_lane = free_lanes[0]
            else:
                target_lane = min(range(3), key=lambda l: lane_occupied_until[l])
                t = max(t, lane_occupied_until[target_lane] + 20)
                
        if len(recent_lanes) >= 2 and recent_lanes[-1] == target_lane and recent_lanes[-2] == target_lane:
            alt_lanes = [l for l in [0, 1, 2] if l != target_lane and lane_occupied_until[l] <= t]
            if alt_lanes:
                if target_lane == 1:
                    target_lane = 0 if (i % 2 == 0) else 2
                elif 1 in alt_lanes:
                    target_lane = 1
                else:
                    target_lane = alt_lanes[0]
                    
        is_hold = (ty == 'hold' or dur > 180)
        if is_hold and dur > 0:
            max_dur = dur
            for next_n in parsed[i+1:min(i+25, len(parsed))]:
                if next_n['t'] > t:
                    gap = next_n['t'] - t - 160
                    if gap < max_dur:
                        max_dur = max(0, gap)
                    break
            if max_dur >= 200:
                dur = max_dur
                ty = 'hold'
                lane_occupied_until[target_lane] = t + dur + 160
            else:
                ty = 'tap'
                dur = 0
                lane_occupied_until[target_lane] = t + 100
        else:
            lane_occupied_until[target_lane] = t + 90
            
        recent_lanes.append(target_lane)
        if len(recent_lanes) > 10: recent_lanes.pop(0)
        
        dir_str = n['direction']
        if ty == 'swipe':
            if target_lane == 0 and dir_str == 'up': dir_str = 'left'
            elif target_lane == 2 and dir_str == 'up': dir_str = 'right'
            
        note_out = {
            'id': i,
            'lane': target_lane,
            'column': target_lane,
            'track': target_lane,
            'time': round(t / 1000.0, 3),
            'timeSec': round(t / 1000.0, 3),
            'timeMs': t,
            'timestamp': t,
            'timestamp_ms': t,
            'type': ty,
            'duration': round(dur / 1000.0, 3),
            'duration_ms': dur,
            'holdDuration': round(dur / 1000.0, 3) if ty == 'hold' else 0,
            'end_timestamp_ms': (t + dur) if ty == 'hold' else None,
            'direction': dir_str if ty == 'swipe' else None,
            'swipeDirection': dir_str if ty == 'swipe' else None,
            'isInstrumental': n['isInst'],
            'lyric': n['lyric']
        }
        final_notes.append(note_out)
        
    chart_data['notes'] = final_notes
    chart_data['total_notes'] = len(final_notes)
    return chart_data

def process_file(in_path, out_path=None):
    if out_path is None:
        out_path = in_path
    with open(in_path, 'r', encoding='utf-8') as f:
        data = json.load(f)
    print(f"Procesando: {in_path} (BPM: {data.get('bpm', 120)})...")
    data = humanize_beatmap_data(data)
    with open(out_path, 'w', encoding='utf-8') as f:
        json.dump(data, f, ensure_ascii=False, indent=2)
    print(f"[OK] Guardado en: {out_path} ({len(data['notes'])} notas balanceadas)")

if __name__ == '__main__':
    parser = argparse.ArgumentParser(description="Humanizador de mapas de Piano Community")
    parser.add_argument('input', help="Ruta al archivo JSON de notas o carpeta")
    parser.add_argument('-o', '--output', help="Ruta de salida (por defecto sobreescribe el original)", default=None)
    args = parser.parse_args()
    
    if os.path.isdir(args.input):
        for fname in os.listdir(args.input):
            if fname.endswith('.json') and not fname.startswith('catalog'):
                p = os.path.join(args.input, fname)
                process_file(p)
    else:
        process_file(args.input, args.output)
