/**
 * Beatstar 120 FPS High-Performance Canvas Rhythm Engine
 * Fixed 3-Lane Rhythm Game with Direct Audio Playback & Sub-Millisecond Synchronization
 * Features:
 * - Upper-Screen Judgements (unobstructed highway)
 * - Canvas Background FX Engine synced 1:1 with song BPM (Aura, Ocean Waves, Synthwave, Aurora)
 * - Real-Time 3-Lane Collision Resolution & Multi-Lane Downsampler (4K/7K/8K -> 3K 2-finger limit)
 * - Rock-solid stability for restart, countdown and arcade revive rewinding
 */

const SFX_MISS_BASE64 = 'data:audio/wav;base64,UklGRpxgAABXQVZFZm10IBAAAAABAAEARKwAAIhYAQACABAAZGF0YXhgAAAAAEgAigD/AQYCygEBBT0IdAN1B9sDvQskDSMOuguXEF8Fjwk7BUIJGgo0FaQIFQcxGGwEExgLF2EWTwcYCSwOHB+yISIQ6xG9EWsSjghfHv0e4QtKELUV9wE8DvwEgBTGHGkjpBV7Fx4P6iGBEYkAbf45D/sJXgDNAEf51RPvFCP1/OoODjgCRSEBEiIklxqpD4giHP23JO/wyglC+fP0EBsG9bz+zvfqADLmhe9zCSLQNNlA42/tf/xSwNi/yO5RwQP3ncyx8d/X+PP83GDYm/ZaA+TXhsR+7tbWU80E0Wro8PV59x3SU+j2sNfWNcORu9Hxjfj63tfzTaN3rGG3HKq4yIKmk7yep/XWBfa/rCLjP97PwVm8P/m2zdHXC8gf6cbj4/quC53gaO/x/q778+/I/LjrqP4+KYj+pvGR+tIBOxBlCt0/iQoBFlQimS0iBREPaxgVCY0X/QgaC/wzgw7XIKlKICydE7r7NPUBE+US3/Iy2hzt6tVj8rLgTsge0sfqicHouiPct7fK4FfyC/KJ6wUNdO2D7hkKfPso9H8eWgxuAz357B7Y+PITLy+gIn0IMQDyA3T9aPhPDxYfTxaqED0nnypV97EBwi7hKWgE3SkrB6ESuTNhE9ceEz/NKswzvSj6P2Q1uz0gQqxTTTpsU70rZk1QU0Q7i0YCVYg+dUDyNbc/tVgIHEIZxytpKhE/6jbwEHcOyfMzAl4ARvfIEb/+Q+04Emj55xLX7STpDPMc9d/i1/OD7n3PndfqzbG10sYT0Om4h7tK1orNd9nxvRLTPejR0Ru5P9VozbnLYdRw/MfryvsI9xrbTPi12Qfr6O8M5lbm7e+96Wbk6+fp8qbXT+Ra1NPrXc1gzhvXNsEl0tLbnMjErjfKdb5ptUiikJvmnRWbfr26uiWfprxZqNWgErB1tKK1QK3evw65n7dw20nGQ7wC3BrIW7rg8jrh4O1P/roEXBAUDBsieiSAFmka0TXkHVo8XyN0MYg+ckXET41h11PEYsxcsF4OaIBIf1tlS1BEMlLJVVpEyUzUSnlDQjhbP7hU81XCVa9HiUYaQss3SjedNrdMrS92PTcz0i6RMjJLUUJlQiM4VTzGQf8xaUvXMZQ1uUWDNc0vBC+XIJ4VSxT4FyABxwhg8joDW+0Q8/L0QPRe2qDhuOAl0FrY7N+G2kDcdOvd5jjjz+VB5mvm9OPky+HVK9tS2bDcydt22kbd/+Mv3ora/N+p0rrhXuMX61Pck+c24/nf2ORb8QnjNuzD4UL1pPDx6Czh1eC56Lnisexz4oHflewx8CwBhf7QAI7qHfDT5rPczdft3Q3dh9qFzXrHHcg605/Q7Mc20NjKy8250A3Chsr60B3GOs1b3Jzi9deh/N/3wfeY+ZcN/grGDO4OcAGJ/SL7IfpwAQ7+QgxmFn0RjBeGG1MP+BB4D7gewBgtDukesQ+zEIoBFCs2MBo3WSlRJTUVxQz1GqEfzxZBFBcOYRQzGXEhTBHUEvEWZSEqHlIqcCK0HZgVpxL9CFUHeweaDDMQCgTg/vABUP+rCsMBMvR9+7MDRvm7+Zf6CfhFDGEM+AlwB8cXcxHvIVAg/SOTIIMOdxNZ/gUQAvqE+v/vu+0V/d3ugu2K954Io/y/BCUYXv0gGTYhjx6+LQ4QZgySIlEaHy2vFRhFyjoESQg+Uzi8TSRPCEIbMBRGBTlzNto9sEOjSBRFHB8LIoIAzQ3JC0gDkg0NEHn4Ye3Qxp3GiMFst7bH97S7xqe1Isu72Za8Stla1KHH5MDP4K3HYM7fyanOZs1L4f/icMrb1LDa09RizTTOfbNFwHbJzbd4tkC8usduzQTM4ONd3TbjZPGd9Pzdseli6m/fv+XD3SzfafE644bqpP9O+Y3qaeOW2H/dod610knMX9PsxgPOVce1tXu9oMUbuKKzssNtsq28vMAFxvjD+8oawnu9wrzPthm2bMsTyw3eEN2G9P8DGhCDISQfIg6vDVwRoRwhIQUsLi7CKZklnDB+NdYZFiCPLe4qnh5tMrQaISfVMs4sHCOONJMtFzaJMvhATjx8RLtR1WVBWLtikklVXGhcFlJuXhJiOFytX3Za1WbLbChWXlh6YIBikmxaZHdYTVJBRkZNR0goRS9Rh0TXPCtLrUCcRa44gDazNXI1tSkHLKs0bRHwCbYF+fnSAywGx/oG+c/3p/Fe7wLi7OHH5tvTr8jK0J3Jyr/Rwi/VkMmNzh7Qr8I3z6KoeLGBs8muL6x6suKx3rLKs5q8oMAIyxLD+c4gwx/B6cMizTvRG9Zh0E7Ej83XyjbLZcSNxozLZMiQ05/RGsbB0QHG7MCjxXbEi8UdwBm6LLUytUbX+s26zBfY3NL6yyPscuW17K3xkvg+/tD8SwfTBR4BbAVICE/+Fgkm/4QD+wj4BRUIgw42CygR0QyLDEUSqAPKD+wHBwvFExAahBXuFpEZAxYuFI0TlB3OHM0jIR06HWceLBRQGAQadCGGFW0S1AyMDY8LPS5yOQA5pzITOMQ9+y9COngvzyKOKqYkxCKZIF8ZOxQQElMOEwQlB+D+wgie/hUE5gRcGZYPTRVMFiwRUxqCH4wdIxl3ImYfXBpGHHMbuBr7FmML5hEDAqz2c/U5837ynPBE793p4uRh6LTffNzz3yDmruCy6eDnu+it6EDvA+sG9DHvgPSK9Ivwlujz6OHrFOod8BDtAPFn9k/5mhY5Ft4YwA7wF7oVUhJIHqkg9CLCIZccARsZIDUmkiTGIbklSSFhIK0h4hoBHSkeSgfHCZ4PIRJ9D9oeZx91I3olcC3lIMAgKR/YFwERgQvBCY4JqwOwByT/y/na+ln8NPUp8wHkNejm5DHgCeS53MnaKtjR6S3s/O/06gDp7/Mx88734Pk/9rn1P+Ac4jffyN9H1+vVUdc42gLY990I283a/9e01vbNVM+/0O3Q2NLszLXH5Mf3xfrJA8p8xN7HW8sjxgDIoslPyQzRt9J82H3YRN4A3LLkZOZw6JDqx+h37CPlLPGc6jbsxumS6Kjv+Ohc6WDtCPTF6nPtTvZkBCUQzxN/FBgfWxN2Ew0fXxzNJOQToSjCNVg7cjfyO1JGaUegQUk7ikT2Qh1CtUTMQo48vznXKHcoPBdWHEQa3BXRGQMbngt2CAL9fgDp/+L8wwSP/KIFT/+aB1IM7QBSDWcMsQftAnoRWBVoGrAq9S5JMFQ5pjzOMu43rDtSODc4hjjXLRYz4zbDL00uby8PNm42FjS7Ns8wKDE8MLQtux8rIJkM2QUgBbz3Rvcs/Rn3hPqMA6MDHf3R+Efz7Pm/+HPla96y34bYtNmO1bTNJs8rtSCx2602tOyq960Rr6awGK52r4erVKkGqa2pAaqMs7izJLybv93JpNEt1yrfwN3N1iLXqtdv1xrZ090L5NfiwOGL58nqjuBE87r6AfuG9pL3KPLx9gD8CPhV84364vb5CjUJxwl4CJgLNRNPGHkSaBeuDNIUOxVYEJkUvxZ5FI8XiRZsHg4jix6aIjk4RTv9QNU/mjsgOvs0qDc/NbcxiylhI3kb3iAWHEodBhdFF6AWAhYhC6wLfA7W/rL6efvR8u31XPZC8RXw/uZw5FbjYN434Dj6EfIB7uXtlOr564TsU/TP7fDvJvHA7HDyHuTg2HjbVd2E4Vblr/LC9MH1Vvpi/FgAfv2VArb8+/vE/GEA9/6+AXH/NP2NAY8BNAISAOwA9QPwAr8H/gQJAdIOUAqlCO8KAgu0C3ALvgifBqMFrxJEBRYDWAXD/Rz2gQE4/AD9k/Gy86bvQu5u8kbzPPFg8370qPNz+Cr0/vVR+Jv1MPZD+Tz4yfu7+mf7ef8lFgUdvRpKHdIhcSWwJIYlxCfwJFMkpyShKXUqOjExL58wxDFRMHEy9TI3MasUeR6fGnUZPxeXIh0ikiClHCcW/xcJElEW3BHvDq4SoRA9EOUPJg1RE2QSuxBsCq8L5QeEC1kHCgnoCE0ReQz8D8wPcAmQC5AM4An9BRwIwQXmAQ0Bdf8m/pj7p/aS7bXmR+fx5hnmfdWO1HDTZdBTzezN1MY+xLjE78rpx1HHLMa3xbbF88kMyJbLQMlTy0PD+cDtvJC8U7smvae/572pvwzCir4Jy3PL2c45y4/P8c5JzpbTt9Gi3kreIdtu28reMeN/5O/lT+pZ617upgDeABgIigtLBM0HTgzjJN0kPio5K6Qt8y7IMrgtBy4dKkAnPSbmI/QivR3fGqgrcCdIJCIkLSLmHrMdlhrpFNwTWBLNFCQH+AhzCAoQYhEKE5wQmhSeGLMXLxSYFIoSXhJJCV4KsAnPCvEHXgrhCzUOEA47EWkTyBObEjESLA+FD/wP5w/UEHMOgwzUDFkMCRBdDRQLmwwFDsQLdQwXDbkMNQ7YGUocoSFhJPEjJyiZLB0uCDGtMCMyly5HK4wnfyZHFKgRXxATCwEJIwWpBcf/Ovos/NIAVAamBusFoAnHA+cC5QbwBKUK/AD38x/5+/ok+fv6aP8PAOL9JQkQDYcBBwGDAQ/9lflq92HvLOzI4xjlOeOz4Ofh5eFJ2/XZz9Zk2+jaW9mL15PTh9bs0lDVBNYizlXS6dAmzljEJMrIyCHLT9Ks1gHY0txM3yvcbd/l5sfm4ud5527z+vnhB7oG5gdWCvkO8RB1Ex4W3BQHFnkW8xVKEJIQcwUIA7ECNf0a/fD/Ff5dAFIFtQYRB7kGywUGCqQNmgaWBLgFLQPeA1kAIf2Y/T/3PfWt8y72AvLh8svx9fEh8OnvrNuB2RDYFNe51bfWdtXU177sLPDS9QLz/fVR9QT09fMT9MbzPPS/9d33qPaj9XH3t/Ys7+b24Otw7Gnr4uwA7LPvvgDpAKwAiAWHBXcPAxAtFI0U6xTTGHsbcRnLG/QhtSX5JfYjhSc1KM0mKiAJH2QhZSJvHxggHCinJk4oNycpJZodths+He8c9x4MHkocshmVHPMalRuAHWEdvhw8Gh8VqBROFTcOUQlJCYwF1gb9BpEGNwZrAjcBtwBj/qD0Rv98+9H8Z/zL+hz7XPuu/ioKNgsIDAUMlw6QCM0DqgQqBaMDpQSeCesJKAjACWQKdhB2D/QRZfy+/NX93gHsAXgG7wUzBTAA2f+h//T9r/vk+2/6U/sl+Yb2evtp9Fn6zvoz/C38zPuI+nf55vhM/qr43/dg94z05vFd99r4O/qn9sH4RviwBX8IugmKCcMKWQvACjMMkglpCdMEhwKCAaEBEgCTADb/pv698T78XP6l/HD4avnD+e368vlo+a7sMenD52boUec/4lLg69+I30reJ+Ai3fTbjM800zDRutRx0wDYp9de1evTqdES027RTtRX1oXWe9m+2/LcHN4M3pPh8+HB4YLfReDW3hbhjN/L3THeY+I04dHjBuXc4/762AaEB7UHcAoyC0cLhAwXEAsRxg8TD6UMZw8KES8SJRNaDRAOGBCSD0gc1BzeGXcPTQ9QEWIPWA6HC6cKCwpfC1IKvwuPBrsHqgTIBT8HegddB2IIgwnFCGAJJQpnCL4Llgs4A48BbQNHA68ATAMQA1UV1RUrFeEVyRcKGu4atRulHRYesR1PJegn1iolLO8oRirxK/s1ITfOOIM4mzjBMwg0ZzDlLtoo5SUzIpofvB1YGiEYMRj3FXsUcRTbE2kUVxRwE5AdRBDdDyoVag8BEPkN0hAMEWIRAhBYEbMSCRJPEJQN+g2VDQn39fYQ9t/14PMV9NzzlPTD82v0yvSV9NTzMfbw9Cn1fPUg95v3jvaM9U/1m/Rw9XXzefES8fzuY+qh6SPt4+Lg4k/n/ecI6pvsWOwM7srvPvD46mnqFO306t3o/uTE41nbh9lW2JbVSdQxzjDOjcuwynfLbM0szVzNJ83dznLZa9kZ2vbZU91y2m3WV9oU3XbemOFz6O/2dviO/2ADhgAZAvQMVgzoC8kLeQegBnkDYAReAZwAdgHWAXH/Rv/a/xcCKwKj/fb8R/tr/LL6dPv1+ej4bPqe+VP4G+6T8BrwNfFZ9Mj3Z/hl+kX7s/lADFkMtg+ED6UOfBGbE/kYHRhlGF8ZchuAE+oUdxbcF8IYwRu2G2EZWxlgFOcSKBImD1YCvAIzAXQB7AIBA8YC4f9Z/5UCJARCAYcAJAE4AKIAUP8g/oP+nPoX+tT5V/+qALEB+QHSAtMCcQMP/aH8XPwO/GH7jPV79Mf0lAWbA4cDYgHAAbcAlv8j/wn75PpC+zD8//77/h7/cgCuAHgAMQT6/5MAhAAGAAoAAgKnCUcKzAqEDT0OIxNSH70hCiC0ILciEyRYI1Uk0iY5KKMmjCXNJgszSTJeL9AuLTKIMjAxAyoWLQYsOCjxJhIlsyCJHrYM/wrICMoGhASY/47/Afht95n3HPeb9ur20vS/9Dj1dvKf8NXwSvME9KX2MfU69dfzlvOt8wbzTe8l9O/y1fNe9eT0GfUr9QX0kPid+IP4AfiZ+Bz2Wfx7/J38EfzF/E7/BgAAAHIBXAazCQYKtAsjA54DQATwBcwFbgdiBZ0EBAInBZMEkffU84jzkvKZ8r7yPvHd8lvvOfEF68nq4+nI6EDnZeQu4+LmpeOJ4qDhDtxk2jLcXdzl3erb1dMS0xnYodh42LjXPdXs1NTSJ9P20QnSf9Ar0JzQwdFk0gjUut8M4S/dceXB51Pos+cf6SDqU+si6rb60PXD9I30MfUh9WfzAPPn8IHyU/Jr87HuZu5X6f/qRerf64HrQuxz7Pbr9usZ9F/ywPIh9coCKwQdCFgKEAynDZkO5hC9Ed8VVRX4FT8UHxO5EkUSzxIFFRUV0xYOGFoYQSQKKhcr4CufLWsuzS7VMWwzzTOaMx4z3THDMi4zaTOSM+sw/zCjMS8xnjeEN5gzwi7xJScmpCR2I4UhaCAVHv0dAB3GID8egB4PHXAdQiBIIHkhriHNIfsgiiCLGrwY3xhlF1YSqw7ODRsMbgnHBk8FvwtIBxQGmgUbB0v8P/w5/ML8t/xe/G7/bgCiAeIA6QGzAr8DaAjJ+TADyAOWBFMDMwSnDaANlguzClsJUgg5BZcDWAL+AVD/Rf7d/Uj9QP0J/Yv8vgAp+wH7jf4U/Gj+wPmQ+iD6mPky+NL3W/eo9M3yivCh73buyN7y3eXcDdrD2NPZdtmP2Q3ZMtk82QzZKtwt1aDUvNSi033U8NQK1w3XetfH18fYndhx2DTa39lh2GTY/eS+4KzgXeJo4vviCeKx4ULi9uJG41rhmeFh41LjbePo4uXkm+Ic493j6+Oz5jblNOYC5n3mTObe53rouexV7b7u3/OL9Hv10/0WATP+5PzR/iEAl/vb/Jj/dwXaBUYHoQg5B8AHQQwKDP8LvQhsGGsYdhd+GY0YfRgDGTwZLxj2F/YXlhhBGLEUDRQLEyoRVRCrEC4QAxAJES4RAhtPF/IYUBlMGg4c1h2uE6MUJBdkFhIV3RT2FYUVwhSFFfQVtRfPFlUWWRd5F0sT8xItD4YMtQu5C3EKNggAB4kC7wDL/+L9Dfjn8jTyb/JV88bzi/ff9jX3G/lA+nb5fvlb/SP9af2l+yv7WvvC+aL5rPk3/Pv6yfta/DP9/P5PBykFfgXaBSkGRAYpBAcEcwQ4DLMLFw6TDSoOOQ5KDrAOkw0fDt4OCxGyEg8TYhMVFDMUAxRfFT4RhBvgGU4Z+RiGGdcf/B8sIF0hySEAJEopQB2lHPEcwh8bIHoaXhq8GoAa5BgnFpAVjBmnEEUO6gxADRsJmQe1AyMCKgLd/6j+PP3M+lL5UPEf8Mruo+0+6xfpHukk5j3mzOZA6cTptuqy6ozr+vWe9Y31Ova191D4kPn0+Nb4A/he9gL0WfNo8RrzTfJ28vXyrfK+8srykPOD9Y/1Q/I/+Vr5F/hw/Cb8zvvw+cv5WfBB8OPvMfAv7Wjua+4M72jryewF7a7tjOsh7CDroeqO7KvtO+2b57nkkeQ35GDkseRq5InlkuTo5+Dlh+en557nTedN5trlVefD5ffkJ+RQ4XjgreA54GbgMt1e0uHR8dM71FjUfdXL1BDVoNQW4w3jiuNX46TjQuQr5armz+c07UbuW/Bo9Pv12PYy92L4W/mG+2z7rgLPAHEAmvvG+Yj5ivgS+Lj1JPbi9UH2TvQm/lX8Wfqg+v/7pPz//vv/pgKPA9kH8wfhCJ0RARgwGWwbwRsMHU8eWR8CIR0iqyRSJZEkzSQ8LgcvxS/hMJ8yYjPDNNY1bTbPO40+Ez6bPn8/9j8pQoJDOURkREJE70MxQ2dEIESeQ9k/0z3MPN07WTqiOx064TNZMDEr5yn/J1om6x+WHvsVWxV3FNAWbxVDFWQURRQmFbgW4BmAGQoZJBg5FhoTuxExEf8PUw1FC2wKu/8r/p/8tvwP/bT6sPnw+P34iebm5Ufl6uS75BzkAeUk5XrlHeWe5SPmwOgR61fl3eqM60vsHOzB7Ojw/fAf8Kjv7O4M9VvyZvGf8F/uGPCO71zvKu9F71rvXO988l/wg/Ar8j3xwe3C6/rrmev87BXsc+ri6V7oOOfr5TflcOSb2gfaYNn811zYmNg32AHYqdVw1SrVztTd1brSQdFG0ebQetEH0mvTE9QK1RHWetd12G/mP+gk6XrpWupm8Dzvsu/C8AHxW/He76vvze/27/PvAe8m7dDtvO3A7Yfteu+H7sDuEO8f7D3tjOzg7LTs0eyq7DHsd+wp8JPwZ/F97yvwCfEQ9QD3YPaB9+D49PmE+HT58fqu/fkA7f+kAPAMOQzdFAcVVhVjFHwbFRxcHPcdXh4qH0whMCJ9IuAkcyUuJmQmIyUAJZwkxSOrI6YjQyP/Ij8jJCMiJ3klFSYuJsAkhyY7J+YZNhokG6sa7RmgGdoZbBnKF+QX4hd3GNgakxrCHM4cDhvqGk0ZLhmvGHEYGhGtD4oOnwcPBpMErAIP/536UPc19m71ivQl9f/zZvO+8L7wC/De8FPyJPI58n3xVPF28d3wqvLG8vbzhvIM84XzKvRG9TL5yfh7+T/6B/vB+64DTgQkBUMHngciCV0JAApcCq0KGgvgCksK3QoQDBUN6xN2FDMVuBUeFuoYnxdgHQAd+xwoGmIa6Bx1JSwlNSXWJColsyUBIOsSeRJnEfAMOwrwCe4JwgkTCQUJ3QinCgsHKQayBesFAQdlBsMEFQTBBMADNwOYAo4B7gCT/RP9gPz7++b65vq2+i752/ii+B/5yPB98L3vVO/u8l7yofFE8VXxIvFR8dbwrfBT8Lfv4e7W70Dv6PHI8QTyV/JF8kbyNPJe8vnytPEI8KryafJU9Ob1jfU49ZTyZfJV7jrv/O4E76LtAO7S7cnpAOhL6Bboj99a3krdndwy3Ive6t6z3l3cn96u3rDe7d4+4Ejg4eCQ4ALiJ+HP4crhr+F14UjfDd603ineCd4F3kTdeN063s/evt9S33fjPeQT5iHnDuhX6W/rKex87PjyQvOu8r3y8fI485XzJ/Q+AGcCuQJ0A/sEcAXkBMEE7QRMAsoCSgLaBI8D6vxj+ir5qffo9nb2U/V09W7xwfHb8lf3/vae9jf4SPkG+nP7Qfyz/Vj+/AIrA6YDYQceCegR6hKEEToS/hK9E9MUwRVdFzwYjBlRGvce+x/1IA8iZCNEJFolRSaWKD8rGy1ILeAtoy48L5YwmTFdMukyVzONOaw6mjvdO/s7qzpmOB841DdAN9A3LTeVMx0y/S+GL3Ax6zBuLiEuzSrWKsEqoS0+LlAuAC7lLRQuiypqK6wqxCmQKNUmjSPsIZsgAR/LHN4a4RdqEkQOwwz/C1wMqQqQCZwIAwiq/9D+/P1H/a386/vW+8H0Jfa09bH1wO3D7rTvUe2x797kQeWW7OHsmO6I7gDuje3p7BPv3+vv6gjqieeo59nmN+ai5Tzl5eSX5Knll+SE5BvlleUI5Bfjo+TE4SDid+Fx4NHfwd7Q3djbE9tK2r3VHtWH1OjP48/hz6/PDc4nzSTO3NPo05LUfNMa01rT9dV31vrW3deK11LYLtlA2jPbp+Gc5KflfOaN58jq5eu07LTtSO7Q7nrule677s3uuO4x7j3tou3a67Hrees67NbrBOwV9Bnz5fP+84L16vV29uf2MvfI98T5VPqR/A/8mPwr/Rz+FP/z/v35KP26/T39v/16/rj/KgGvAfoBFgcjBZcIbgiUBNcDcAZHBvkFOgYUBQ8FpgXKBcEFrwbuBuEEIgVdBpUGpQeeB5kS5hIFEygTeBOYE2cVzhQkFUIV1ROxFCQVwQ+lDmMPoA/UD0oQCxGTEaAYchk7GkEbAh0SI6kkTCUfJY8lUiWnJWEmkSa8I1ojESNSIMwfRx+LHgwdnRMME24S3xEvEaIOqw3cDJwJ6wjlB3sHVAeaBesE8wNKA9UCKQIA/9D+K/9//rb+9P4wADsC8wPSAx4EZQSeBCUHPwo6Cj8K4AmiCd0JjgluCTYJpgOFAycDLgE1AYYBqgJfBW0FjwWWBY0FgQa6BegHggdFBywGFgYCB4MK1QvfC8wLEgx8DFIKFAUpBd4FPwRWA2cDiwOQA1EDSQMqA9UDvQBCABX/Gf+E/0b/AQHbAFkBMgFNAWsBZQFxAnYB+wgfCT0J1/4C/RH9vQGXAWoBewHs/JP8BPyW+9f8W/zR+3X7+fi7+Kv4WfiX91j3/faK9tj2fvaC9133Yfd092b3i/aV9sf2Off09pb2F/hy+DT7Z/zR/D39SgO1A24CKQNTA4ED+wIVA9oC5wDQ/4X/Gf4B+oX3h/ay9f70ePUm9Zz0De6a7j7uuu5z7p3u8OvB6ynrRutl6h/q+epa6tPoV+dH5gnmVOXY5AnhYuAu4EHgSuCA4AThm+LJ4mjjR+Jp28bbetzf3tbeaeFr4UDgQuBk4KHg+uB+4ezmQejf6LXp6uoY7Uruy+5k78LuYu+G7+HwjPDm7ezsgvEp8dXwovAn8Dvwme7Y7hHuKvBK8HTwfvEw8+/z/fTJ9dv2lvf7+Xz63gTUBvAHAQz2CyMNzw2DDnIRTBIXEyoU6xTXFYAWvxg+GtMaYhv0Gz8cixxcGQMaXBm0GU0ZDxkPGNYX9hcAGP4X9xf3F0QYtRgkGVoZYRoOFVEUbBTmFd4VTBY0FtgUOxtyGlkabhpQGmQZahkzGHAYrRgyGs8aPRuKG5YabiFtIEUhayF7IWQhDCEFIKgfZR/+HlAe7hzpG9sZXRj9F0wZuxlNGSAZ/xj/GLYVWBYdFt8VmRUCE8wSkA/RDzwPyA71CuAKmAgXB3sMggdOBxUKvgZQBzcH/QbdBrUGlAhqBzYHBgcnBlsGJAZOB0EJGAnqCLgIRQizB4gHogetB90GTgbIBmYFXAXfBDUEewS7A6cBbgCs/9v+avyW+7/6MfiS9/X2kuZW5XTkaeRr5hrmGuZt5RjlZeZi54Hnbeix6GvozePx4x7kL+SB5k7nQecU5y/m+ubh5qvmrOgZ593mUOb+5b3lfuU45ZPl+uT25AfkxeN442fg/t/M3+XiLOIw4m7iwOKe4pDig+Jm4nbiJuMv4Q7izeED4gvjdePj49vjzOEl42fj6OEl4n3iE+PI4yXkseMc5qXlieet7K3rEuzy7b3uh++Y8BnxDfiU+pj7f/y+/aL+fP45/0gA1wCuAf4BFwZuBqcGTg2ODbYNkQ5pDloNfA33DGUNag4wDL0LCgwLChAKKQpbCnEKQA1wDZ0NIw3BDTYQGxJcElASfg9/D8UPPBB9EHkPQBBHED8PHQ/wDqEOXQlQBfsGkAbgBGUEYALNAVIB2/9nCPgH2QflB1YHRAcdByAHAAgICAMHOgejB5YHIQlfCf0J5gqjC5AL5gv1C/wL/Aw8DjIOMg4ODv8NKg4hDjEO+w6FC5sLlgvjCgQLQQvUCw0NKA1LDWUNugxADRMNKw43EFwQLRAxCqgQdxJbE7IT9hMWFXcVshSQEpYSyRLvDkoO+g2gDSsNjgxCC6gKJQlQB5sGpQU7BQsFpQIdA9kC5QJ1A2kDZgNYA78DTQNsBnIGcwZFA3QCbwKfA4kDdQOBA6EBjQFpAVkBAwL2AeUB5gGoBq4GwQauBmMGCAXRBIMEfAQlBPL/pP9m/3L+Lf6Y/Wn9Uv1f/Sj97fyD/aH9xf54AFgBdwHsA/gDTwFkAS4B6wBRAPH/Y/8X/mr8zvu9+pX4JPdg9tPymuil6GnoNO5463/sduzQ7ODsJO067F/sWeyO7mruie4i7x7vBO7f7rju7+747h7v4+3+7Urus+4V79jzGPUK9lj2yPZt9pzzxfMF9L7zmvOI9F/09fPO87vzvPPU8wv0YPYL93f3BvjI+Pv5gPsG/Jb8nfxW/qD+Yf9g/1n++P3g/6n/aP92/hX+6f0D/cj+Ov7g/rL+if69/gf+Gf79/gv/Mf8q/8//oP+5ABcBEgFGArwBtAHCAE/8Df3y/Nr86fwN/iD+If71/GD9b/1//Ub+XvhR+Mr22/Zb9kD20fVx9b70YPQs9Bby5fG+8arxx/EG8ljyp/Jg84Hxn/Em8qX4MPny+Xz6ffq6/e79ZP4LAGsAaQDDAI8APACUAHAB5wFGApUCWgJlBSIFowXYBRQO1w7HDo4SRxFTDyAPyA4fDpkNoQzmC6QLHQyNC1wLUQtYC3wLTgoSCEoIjAj7CVUJswl+CRAKRAp/CkgJlwnuCI0I2AzoCu8KLQwkCmkKZQpTCk4KJwkECqAJrAnACZEJ3An9CWQLcQyaDL4MiBKEEm0SeRKcErISZhIwEsMTMBMtE/wSqA7ODokOug1LDRAN0AziC6ELCQwHC84KkAqrAxoDhwFoAR8C2AGwAT8BSQCzAAIB+wAfAzwDKQNOAX0BtwHrARYDngN1BKwFbwXeBeAFyAXgAxcDzgJUAuYBcwFMAMn/g//X/mn+nf0f/aP8Bvur91P3Z/jn92n4Xvhh+Df4Gfj5+9v70PsM/C77hfto+9r6VPuV++H7H/1x/Dr9lf07/Z79EP6a/i//qASxBDH+IP7//ikBsAC9ANz79fsC/Aj7O/rF/HH9ev14/Z/9pP0//T/9af1g/Xn9XP1+/2H/Nf+1AcD/jQCFAAcAIP+v/u/9kP1s/UL7ffoL+qb4IPip98HwW/Ai8djwlfAU8KDvZvD08NXwmPAz7//u6u7s7pXw/+8u8BXw6+7R7r7up+6H7PXq1uv17IDslOwH7Bjs2OyH7Gbwd/Ci8NTwu/DL8MjwzfAo8SLxqPDp8Avx7++X8L7wGPGg8SPyXfLR8jTzofOA9Cb2pPYr96T3J/jA+EH5yPls/oD++/62BDIEpwQmBcgFYAjOCD4JqQnBCVYKnApmC5AMiA2xDWALPg4NDnwOGwwwDJYMpQwyDCgLBAtRCpAILgj1B8IHjAdQB9MG/QR7BN0DyQQxBTQFTAVzBMkEyQQ4DIEMgAx6DGoMhgxDDN4MzAy8DFoL/Ar7CnoKhQqZCsQKaAaUBr4GvgtEDHwMsQzqDBwPTA96D5EPig8KD/4ORQ5FDikPYg09DR0NrwyKDEIMIgwJDPoLyQsvDEUMHwxeDCgLNgvoCo0LKAuSCCgInQcPB8MFNAV6/6D+qv03/Sz6MvmW+FH47vbK8v7yuPNi9nj1Kfde97j37fcx+JL5uvnJ+W/+yv3Z/Rr+F/6g/f398P0M/hn+NP6+/dT8Bf3d/RX+IQCwABsBPAFnATgB/f/+/wUA1P+x/zcAFwDh/83/x//RAOoAFwEsApIC4QI+A7AD6QSjBewFMAYxBt0G5AYTB+cGQwbeBWgGcgUPBGQD+AKpAqoDOQTUA/oDzgOrA7UDYgP9A8AAwADGALUA5QC1AKL+mv9h/6r4KvjZ94n2VvRP9O3zjvNC82f4Jfjh9431gPVR9Sj15/VD8xnyUPE18d7wtPBq8Cnwyu+U73jvmu767QLuH+5e7rnuK++o72DwC/CW8E/ylPVa9rz7fPz9/NH+U//l/+kAVgGMAdsB4QHPAfsBwAHrAY0FoQWABLoFkgXABdEFQwmVCZAJvgs3C2UKTQoiCkEI+Qd8BxIH1gbjBn4GNgduBkQGJgZ7BWMEVgRRBHwCHgIxAgkCNwI9AtsCRgJSAvIBqgFTA1oCNgGHAf8B4gGkAWEBkgDh/w4Avf+h/5P/cv+N/6D/QgD6+yP8Tvxr/3kAhgCcAEP9Tv0n/f/8jf0r/fz8svym+qn6S/qz+Ub58vii+A/4zffZ92P2PvYe9jvzmfP+8gPzZvNh82rzVvML81Tzk/Ov87b05fRz9Hf6ufr3+8n9hP7//qD/agCbABUBXwGcAaEBhwGbAZEBgQFkAa/+dv5N/vD9p/1A/On7Afsz+q34cvjY+J74PPxJ/Gj8APso+wb9QP0Z/oT+ff75/kT/TQDUAEABrQF8AnoCEgN6AwYDcAPiA2AE5QR7B80HYwWxBWcGqwfTBzQIfg7fDjgPHQ8PD2EQ4xAZEUQReBGYEYYRmhEuETkRUhFSEUUSRxJDEmATiBPsE/UTxxNoE8ITZRMmE/YSZxDbD2UPLwuaCgEKqwYKBuQFvAQkBIoC5QHMAaMBPAGj/sr9ff1I/Sj9wv0A/gv+/f2A/Xf9cf1p/YX82/uq/QT/yv7H/vP97f0x/gL+lv+T/53/rP+d/6D/m/+a/7v/OwD+/wkAAwBz/7L+nf6Y/qH+pP6G/oD+c/6a/sj+T/9g/37/UfmB+cP5BfpT+p//yv8JAZsDGARyBMwEtADkASQCWwKIAocCswK0AuYCOgPrAssCnwGgAsYDxAOyAZABkwF1ASMBlABnAIYAq/9g/yT/5f6g/jH8xPvA+kb6vPnU+bH52vh3+c34o/hY+C/7CfvI+or64Pi1+Gb4dPjD+In4wfdk9y33vPaE9k/2IfYs8wHzre+Q8RLxAvH78AHx5/EC8ivyWPKF8ozy0PLU8i7z7vOa9+/3RfhY+aX53fke+ln6kPqw+gf7M/tA++v6evqN+nj6x/ql+pn5d/lJ+Rz5oPiW9z/1evUl9QT1zPMN8tfxxPGM9dXz8vNI9G/1GfVa9YX1x/UB9kj2EPc5+HH2sPi8+Br5kPnt+bf9O/6Q/vL+SP+e/7D/iv/T/7sB+gH5AlQDnQNoApYCoQI/AmYClgK0At8CVwOKCbwJAQpNCpAL6gtJDAYNdA3SDS8OZg8PEHsQrxDaEOIQWBFZEWgRThEBEc4QABGREPYPqQ94D1MPvA91EEUQcw9WDzgPKg/xDhgPng1+DV4NMg0iDesMaQuqCHgIkQWkBncG5AX2BPYE0wSIBW8FnAcDCOEH2wbCBpEGVwZ1BhgDUgKrAUQBjvwT/Af7fPrk+WD56vhT97L2YPYf9qD0jPSL9Jj0xfQJ9TL13/U394f3yfkc+lb6Ifth+6n7Jfw4/eT8H/1A/Vz9l/2u/fT9tP/6/8L/iQC+ABYBLQXgBj8HbAqHC3gLQwuBCoMKxgmvCXwJTgkwCbIIgQjKCHQIYwhbCBwIswe9B84HHgcLBygHpweaCKYI6whYB1AHEQfUBl4HwwYPBvEF3QUJBaIEOASTA/4CyQJjAicA6v/c/r3+of7I/jT3rvew9/L4WPlT+VP54ffc98L38/gk+fH41Pgy+Fv7WfsB/MX7t/if+Iv4XvhV+G344/fl9+b3Nvdj9yH3HPc39x73BPfX9oz2evZh9mn1oPWn9UT1nfeR9/f3o/jk+BT5XvnD+fL5RvqP+lH7hvux+/D7IvxQ/EH9TPxd/HH8avxm/OX70/sH+736JfoW+pD7gvsR/SL9PP2x/M/8pf3J/d39Ev4T/kf+Yv7J/ssBAAAXAFMAMwBSAFsACACc/6z/xf/l/+cA+wDw/9YAJAFxAIwAwQByAyIEVARTBFQE5QQaBSoFLwU0BSwFCwX3BKwEkwQIBO8DeANqA18D8P8HAEEAXABoAGYAuQDEAHMElQS6A7cDugMnAhUC+wG2AI0AVwHnAK4AAwBE/zD/E//X/q39Pf0G/dj86fkP+gz68vnJ+eb5ufmK+VX5Xv2h+yX8dPwX/M/7L/vm+r76avpj+i36Bfro+cj5uvm0+eP3A/hU+F34jfiA+e751vkH+j/6e/qy+tf6Avsm+5P8xvwb/Tv9Xf1l+o76wPrz+i/7iP37/Kr97P5U/7H/EwCb/tP/MQCPAOcALQGDAcUBGgJ6ApMCdQUsBcwFegbSBucGDAdCB2wHgweCB60H+gehC8ML6wsRDDIM2wvkC6kLoguOC7cLwgt7CwoLygq8CpwKzAtGCygLDAtaCk0KZgt4C6kLpgtpC10LYgtPC1QLyQvLC50KUwvvCbIKbQqDCFsILwhZCCQI7gdABwAHrAZvBhUG4AXXBQoH2AZ8BaEFuQTgAbgBAgLcAa4BmQF0AUMB6gCIAF8AJgAbAOX/T/8g/4H+Wf4W/p79ovx9/Wb9a/0A/WH8avyE/D3+AwEtAWsB/AHnAQoCHAIwAhz9Iv1X/a/9xfyI/TH8Jvwl/Br8gf2M/Yf9jP2Q/Zn9if1l/dL5kfoO+2v7hPuS+9X50vm9+S/6HfoL+u750/nW+Wv+T/47/iv+hf6A/oD+8fwA/Qv9G/2K/cD93v1W/l3+nf3E/bn9s/2b/W39SP10/jb+5/25/Zr9Ff09/Yv9fP0v/TL9O/1P/Vb9iP3E/dv98/1y/o3+k/4I/vP86fyz+yL8A/yy+zP7Evve+gH77/qt+6z7dfsr+v/5zvmh+Z75LPjY95f3d/eN9dv1+PLa8rnyoPKO8gLy3fHY8djxUvFj8S/yTfIL8kDyavLM8pj01vTm9Sj2YPbV9g/3TPec95b4ifiz+E/8Y/x+/IX8Ofro+vX6yfoG+wT7EvtJ/Oz8Bf1R/sX+wv63/nn+lf5L/Wv9h/2p/df9Sv4n/4b/ov/a/xMAMwA+AHcArwCTALcAxQUjBkcGdga+Br8I7QgHCSYJnQnuCOgIJglrCWEJswzYDOQM9gwuDU4NpQzODJsMyAzxDDINLwqKCkUK7Qo2C/8LGAyUC6cLsAtBDGUMXAxYDBcMag3LDQMO1A1uDD8M8gqpCmgKLQqoCVkJVwi2B3AHlAY8BvQFmwVIBfIEmAS9AoYC+wH1AeMBqQGaAvYCGwNgA3cDFwHdAZ7+pf65/tj/EQAMAAAA+/+F/3X/tv8q/w7/8/7P/q/+XP45/sr9k/08/dv8Y/1G/db9xP20/V79Tf2I/Xf9X/1V/Tf9L/1D/Vf9iP66/bv90v3I/d/9nv6P/nv+n/7J/vj+7f8WABk=';
const LEAD_IN_TIME = 1200; // 1.2 segundos de preparación visual (400ms por dígito)

// ==========================================
// GLOBAL COLOR UTILITIES
// ==========================================
function hexToRgba(hex, alpha) {
  const a = Math.max(0, Math.min(1, alpha));
  if (typeof hex === 'string' && hex.startsWith('#')) {
    const c = hex.slice(1);
    let r = 255, g = 255, b = 255;
    if (c.length === 3) {
      r = parseInt(c[0] + c[0], 16);
      g = parseInt(c[1] + c[1], 16);
      b = parseInt(c[2] + c[2], 16);
    } else {
      r = parseInt(c.substring(0, 2), 16);
      g = parseInt(c.substring(2, 4), 16);
      b = parseInt(c.substring(4, 6), 16);
    }
    r = Number.isFinite(r) ? r : 255;
    g = Number.isFinite(g) ? g : 255;
    b = Number.isFinite(b) ? b : 255;
    return `rgba(${r}, ${g}, ${b}, ${a.toFixed(3)})`;
  }
  return `rgba(197, 160, 89, ${a.toFixed(3)})`;
}


// ==========================================
// DYNAMIC SONG COLOR PALETTE REGISTRY (BEATSTAR PRESETS & ADAPTIVE SYSTEM)
// ==========================================
const SONG_COLOR_PALETTES = {
  extreme_magenta: {
    id: 'extreme_magenta',
    name: 'Extremo / Magenta Neón',
    primary: '#ff007f',
    secondary: '#d946ef',
    glow: '#ff007f',
    ribs: '#f43f5e',
    spotlight1: '#ff007f',
    spotlight2: '#a855f7',
    spark: '#ff70c5'
  },
  cyber_cyan: {
    id: 'cyber_cyan',
    name: 'Cyber / Cian Eléctrico',
    primary: '#00f2fe',
    secondary: '#00c6ff',
    glow: '#00f2fe',
    ribs: '#00f5d4',
    spotlight1: '#00f2fe',
    spotlight2: '#3b82f6',
    spark: '#a5f3fc'
  },
  fever_gold: {
    id: 'fever_gold',
    name: 'Fiebre / Oro Radiante',
    primary: '#ffd700',
    secondary: '#ffb703',
    glow: '#ffaa00',
    ribs: '#ffe082',
    spotlight1: '#ffd700',
    spotlight2: '#fb8500',
    spark: '#fff8db'
  },
  amethyst: {
    id: 'amethyst',
    name: 'Amatista / Electrónica',
    primary: '#9b51e0',
    secondary: '#e0aaff',
    glow: '#9b51e0',
    ribs: '#c77dff',
    spotlight1: '#9b51e0',
    spotlight2: '#7b2cbf',
    spark: '#e0aaff'
  },
  fire: {
    id: 'fire',
    name: 'Fuego / Rock',
    primary: '#f2994a',
    secondary: '#eb5757',
    glow: '#f2994a',
    ribs: '#ff7a00',
    spotlight1: '#f2994a',
    spotlight2: '#d90429',
    spark: '#ffbe0b'
  },
  emerald: {
    id: 'emerald',
    name: 'Esmeralda / Chill',
    primary: '#00f5a0',
    secondary: '#6fcf97',
    glow: '#00f5a0',
    ribs: '#2ec4b6',
    spotlight1: '#00f5a0',
    spotlight2: '#06d6a0',
    spark: '#a7f3d0'
  },
  classic: {
    id: 'classic',
    name: 'Clásico / Concierto',
    primary: '#e5b869',
    secondary: '#ffffff',
    glow: '#e5b869',
    ribs: '#f3d791',
    spotlight1: '#e5b869',
    spotlight2: '#d4af37',
    spark: '#fff4d1'
  }
};

function getSongColorPalette(meta = {}) {
  if (meta.palette && SONG_COLOR_PALETTES[meta.palette]) {
    return SONG_COLOR_PALETTES[meta.palette];
  }
  if (meta.primary && meta.secondary) {
    return {
      id: meta.palette || 'custom',
      name: meta.palette || 'Personalizada',
      primary: meta.primary,
      secondary: meta.secondary,
      glow: meta.glow || meta.primary,
      ribs: meta.ribs || meta.secondary,
      spotlight1: meta.primary,
      spotlight2: meta.secondary,
      spark: meta.secondary
    };
  }

  const text = `${meta.title || ''} ${meta.artist || ''} ${meta.genre || ''} ${meta.difficulty_name || ''}`.toLowerCase();
  if (text.includes('extreme') || text.includes('extremo') || text.includes('experto') || text.includes('frenzy') || text.includes('hard') || text.includes('difícil')) {
    return SONG_COLOR_PALETTES.extreme_magenta;
  }
  if (text.includes('cyber') || text.includes('synth') || text.includes('electronic') || text.includes('electro') || text.includes('galaxy') || text.includes('neon') || text.includes('future') || text.includes('remix')) {
    return SONG_COLOR_PALETTES.cyber_cyan;
  }
  if (text.includes('fire') || text.includes('fuego') || text.includes('rock') || text.includes('metal') || text.includes('dragon') || text.includes('impuestos') || text.includes('sanxe') || text.includes('pikete')) {
    return SONG_COLOR_PALETTES.fire;
  }
  if (text.includes('chill') || text.includes('groove') || text.includes('moonlight') || text.includes('flow') || text.includes('nature') || text.includes('rain') || text.includes('breeze') || text.includes('summer') || text.includes('fácil') || text.includes('easy')) {
    return SONG_COLOR_PALETTES.emerald;
  }
  if (text.includes('piano') || text.includes('renacer') || text.includes('chopin') || text.includes('classic') || text.includes('clásic') || text.includes('mozart') || text.includes('bach') || text.includes('beethoven') || text.includes('bumblebee') || text.includes('rachmaninoff')) {
    return SONG_COLOR_PALETTES.classic;
  }

  // Fallback determinista por hash del título
  const str = (meta.title || '') + (meta.id || 'default');
  let hash = 0;
  for (let i = 0; i < str.length; i++) hash = (hash * 31 + str.charCodeAt(i)) >>> 0;
  const keys = ['extreme_magenta', 'cyber_cyan', 'fever_gold', 'amethyst', 'fire', 'emerald'];
  return SONG_COLOR_PALETTES[keys[hash % keys.length]];
}

function hexToRgb(hex) {
  if (!hex || typeof hex !== 'string') return { r: 229, g: 184, b: 105 };
  let c = hex.replace('#', '').trim();
  if (c.length === 3) c = c.split('').map(x => x + x).join('');
  const num = parseInt(c, 16);
  if (isNaN(num)) return { r: 229, g: 184, b: 105 };
  return {
    r: (num >> 16) & 255,
    g: (num >> 8) & 255,
    b: num & 255
  };
}

class HighFidelityAudioPlayer {
  constructor() {
    const savedVol = parseFloat(localStorage.getItem('beatstar_master_volume') ?? '1.0');
    const savedMuted = localStorage.getItem('beatstar_master_muted') === 'true';
    this.masterVolume = isNaN(savedVol) ? 1.0 : Math.max(0, Math.min(1, savedVol));
    this.isMuted = savedMuted;
    this.audioCtx = null;
  }

  setVolume(vol, muted = false) {
    this.masterVolume = Math.max(0, Math.min(1, vol));
    this.isMuted = !!muted;
  }

  ensureContext() {
    try {
      if (!this.audioCtx) {
        const AudioContextClass = window.AudioContext || window.webkitAudioContext;
        if (AudioContextClass) {
          this.audioCtx = new AudioContextClass();
        }
      }
      if (this.audioCtx && this.audioCtx.state === 'suspended') {
        this.audioCtx.resume().catch(() => {});
      }
    } catch (e) {}
    return this.audioCtx;
  }

  playPunchyArcadeMiss() {
    try {
      const ctx = this.ensureContext();
      if (!ctx) return;
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(140, now);
      osc.frequency.exponentialRampToValueAtTime(32, now + 0.18);
      const vol = this.isMuted ? 0 : (this.masterVolume * 0.45);
      gain.gain.setValueAtTime(vol, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.20);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.20);
    } catch (e) {}
  }

  playAnalogTapeRewind() {
    try {
      const ctx = this.ensureContext();
      if (!ctx) return;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      const now = ctx.currentTime;
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(800, now);
      osc.frequency.exponentialRampToValueAtTime(150, now + 0.45);
      gain.gain.setValueAtTime(0.35, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.45);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.45);
    } catch (e) {}
  }

  playPianoChime(scheduledTime = null, freq = 523.25) {
    try {
      const ctx = this.ensureContext();
      if (!ctx) return;
      const t = scheduledTime !== null ? scheduledTime : ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, t);
      gain.gain.setValueAtTime(0.4, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.35);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(t);
      osc.stop(t + 0.35);
    } catch (e) {}
  }

  playClick(scheduledTime = null) {
    try {
      const ctx = this.ensureContext();
      if (!ctx) return;
      const t = scheduledTime !== null ? scheduledTime : ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(1200, t);
      osc.frequency.exponentialRampToValueAtTime(300, t + 0.05);
      gain.gain.setValueAtTime(0.3, t);
      gain.gain.exponentialRampToValueAtTime(0.01, t + 0.05);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(t);
      osc.stop(t + 0.05);
    } catch (e) {}
  }
}

// ==========================================
// DIRECT HIGH-FIDELITY AUDIO SYNC ENGINE
// ==========================================

class DirectAudioSync {
  constructor(onReady, onEnded, onError) {
    this.audioElement = new Audio();
    this.audioElement.preload = 'auto';
    
    this.volume = 1.0;
    this.muted = false;
    this.audioElement.muted = false;
    this.audioElement.volume = 1.0;
    this._blobUrl = null;
    
    this.onReady = onReady;
    this.onEnded = onEnded;
    this.onError = onError;

    this.isPlaying = false;
    this.isLoaded = false;
    this.duration = 0;
    this.playbackRate = 1.0;
    
    // High-resolution clock anchor
    this.baseTimeMs = 0;
    this.basePerfNow = performance.now();

    const enforceSpeedAndPitch = () => {
      if (this.audioElement) {
        try {
          this.audioElement.defaultPlaybackRate = this.playbackRate;
          this.audioElement.playbackRate = this.playbackRate;
          this.audioElement.preservesPitch = true;
          this.audioElement.mozPreservesPitch = true;
          this.audioElement.webkitPreservesPitch = true;
        } catch (e) {}
      }
    };

    this.audioElement.addEventListener('canplaythrough', () => {
      this.isLoaded = true;
      this.duration = this.audioElement.duration || 0;
      enforceSpeedAndPitch();
      if (this.onReady) this.onReady();
    });

    this.audioElement.addEventListener('playing', () => {
      this.isPlaying = true;
      enforceSpeedAndPitch();
      this.baseTimeMs = (this.audioElement.currentTime || 0) * 1000;
      this.basePerfNow = performance.now();
      const toast = document.getElementById('audioUnlockToast');
      if (toast) toast.classList.remove('show');
    });

    this.audioElement.addEventListener('pause', () => {
      this.isPlaying = false;
      this.baseTimeMs = (this.audioElement.currentTime || 0) * 1000;
      this.basePerfNow = performance.now();
    });

    this.audioElement.addEventListener('seeking', () => {
      enforceSpeedAndPitch();
      this.baseTimeMs = (this.audioElement.currentTime || 0) * 1000;
      this.basePerfNow = performance.now();
    });

    this.audioElement.addEventListener('seeked', () => {
      enforceSpeedAndPitch();
      this.baseTimeMs = (this.audioElement.currentTime || 0) * 1000;
      this.basePerfNow = performance.now();
    });

    this.audioElement.addEventListener('ended', () => {
      this.isPlaying = false;
      if (this.onEnded) this.onEnded();
    });

    this.audioElement.addEventListener('error', (e) => {
      console.warn('Audio playback error event:', e);
      if (this.audioElement.src && this.onError) {
        this.onError('Error en la reproducción de audio.');
      }
    });

    this.audioElement.addEventListener('timeupdate', () => {
      if (this.isPlaying) {
        const audioCurrent = this.audioElement.currentTime;
        const now = performance.now();
        const actual = audioCurrent * 1000;
        this.baseTimeMs = actual;
        this.basePerfNow = now;
      }
    });
  }

  unlockAudio() {
    if (window.engine && (window.engine.isPaused || window.engine.isProcessingMiss || window.engine.isGameOver || !window.engine.isRunning)) {
      return;
    }
    if (this.audioElement) {
      this.audioElement.muted = false;
      this.audioElement.volume = 1.0;
      try {
        const p = this.audioElement.play();
        if (p && typeof p.then === 'function') {
          p.then(() => {
            if (!this.isPlaying) {
              this.audioElement.pause();
            }
            this.audioElement.muted = false;
            this.audioElement.volume = 1.0;
          }).catch(() => {
            this.audioElement.muted = false;
            this.audioElement.volume = 1.0;
          });
        }
      } catch (e) {
        this.audioElement.muted = false;
        this.audioElement.volume = 1.0;
      }
    }
  }

  showUnlockPrompt() {
    const toast = document.getElementById('audioUnlockToast');
    if (toast) {
      toast.classList.add('show');
    }
  }

  setPlaybackRate(rate) {
    const r = Math.max(0.5, Math.min(2.0, parseFloat(rate) || 1.0));
    this.playbackRate = r;
    if (this.audioElement) {
      try {
        this.audioElement.defaultPlaybackRate = r;
        this.audioElement.playbackRate = r;
        this.audioElement.preservesPitch = true;
        this.audioElement.mozPreservesPitch = true;
        this.audioElement.webkitPreservesPitch = true;
      } catch (e) {}
    }
    this.baseTimeMs = (this.audioElement.currentTime || 0) * 1000;
    this.basePerfNow = performance.now();
  }

  setVolume(vol, muted = false) {
    this.volume = isNaN(vol) ? 1.0 : Math.max(0, Math.min(1, vol));
    this.muted = !!muted;
    if (this.audioElement) {
      this.audioElement.muted = this.muted;
      this.audioElement.volume = this.muted ? 0 : this.volume;
    }
  }

  loadAudioBlob(blob) {
    if (typeof window !== 'undefined' && typeof window.pauseMenuAmbientMusic === 'function') {
      try { window.pauseMenuAmbientMusic(); } catch (_) {}
    }
    if (!blob) return;
    if (typeof blob === 'string') {
      this.loadAudioUrl(blob);
      return;
    }
    if (this._blobUrl) {
      try { URL.revokeObjectURL(this._blobUrl); } catch (e) {}
    }
    this._blobUrl = URL.createObjectURL(blob);
    this.loadAudioUrl(this._blobUrl);
  }

  loadAudioUrl(url) {
    if (typeof window !== 'undefined' && typeof window.pauseMenuAmbientMusic === 'function') {
      try { window.pauseMenuAmbientMusic(); } catch (_) {}
    }
    this.isLoaded = false;
    this.isPlaying = false;
    this.audioElement.loop = false;
    if (url) {
      this.audioElement.src = url;
      if (this.playbackRate !== 1.0) {
        this.audioElement.playbackRate = this.playbackRate;
      }
      this.audioElement.load();
    } else {
      this.audioElement.removeAttribute('src');
      this.audioElement.load();
    }
    this.baseTimeMs = 0;
    this.basePerfNow = performance.now();
  }

  play() {
    if (typeof window !== 'undefined' && typeof window.pauseMenuAmbientMusic === 'function') {
      try { window.pauseMenuAmbientMusic(); } catch (_) {}
    }
    if (!this.audioElement.src) return Promise.resolve();
    // Invariante absoluto: Si el juego está en pausa, procesando fallo, en game over, no iniciado o en cuenta atrás, no reproducir
    if (window.engine && (window.engine.isPaused || window.engine.isProcessingMiss || window.engine.isGameOver || !window.engine.isRunning || window.engine.isCountingDown)) {
      return Promise.resolve();
    }
    try {
      try {
        this.audioElement.defaultPlaybackRate = this.playbackRate;
        this.audioElement.playbackRate = this.playbackRate;
        this.audioElement.preservesPitch = true;
        this.audioElement.mozPreservesPitch = true;
        this.audioElement.webkitPreservesPitch = true;
      } catch (e) {}

      this.audioElement.muted = this.muted;
      this.audioElement.volume = this.muted ? 0 : this.volume;

      const p = this.audioElement.play();
      if (p && typeof p.then === 'function') {
        return p.then(() => {
          // Si mientras resolvía la promesa el juego se pausó o falló, pausar inmediatamente
          if (window.engine && (window.engine.isPaused || window.engine.isProcessingMiss || window.engine.isGameOver || !window.engine.isRunning || window.engine.isCountingDown)) {
            this.pause();
            return;
          }
          this.isPlaying = true;
          this.baseTimeMs = (this.audioElement.currentTime || 0) * 1000;
          this.basePerfNow = performance.now();
          const toast = document.getElementById('audioUnlockToast');
          if (toast) toast.classList.remove('show');
        }).catch(err => {
          if (err.name !== 'AbortError') {
            console.warn('[DirectAudioSync] Audio play request catch:', err);
            if (err.name === 'NotAllowedError') {
              this.showUnlockPrompt();
            }
          }
        });
      }
      return Promise.resolve();
    } catch (e) {
      console.warn('Audio play exception:', e);
      return Promise.resolve();
    }
  }

  pause() {
    this.isPlaying = false;
    try {
      this.audioElement.pause();
    } catch (e) {}
    this.baseTimeMs = (this.audioElement.currentTime || 0) * 1000;
    this.basePerfNow = performance.now();
  }

  seekTo(seconds) {
    const sec = Math.max(0, parseFloat(seconds) || 0);
    try {
      if (this.audioElement.readyState >= 1) {
        this.audioElement.currentTime = sec;
      } else {
        const onMeta = () => {
          try { this.audioElement.currentTime = sec; } catch (e) {}
          this.audioElement.removeEventListener('loadedmetadata', onMeta);
        };
        this.audioElement.addEventListener('loadedmetadata', onMeta, { once: true });
      }
    } catch (e) {}
    this.baseTimeMs = sec * 1000;
    this.basePerfNow = performance.now();
  }

  getCurrentTimeMs() {
    if (!this.isPlaying) {
      return (this.audioElement.currentTime || 0) * 1000;
    }
    const rate = this.playbackRate || this.audioElement.playbackRate || 1.0;
    const elapsed = (performance.now() - this.basePerfNow) * rate;
    return Math.max(0, this.baseTimeMs + elapsed);
  }
}

// ==========================================
// HIGH PERFORMANCE ZERO-GC PARTICLE POOL SYSTEM
// ==========================================

class ParticleSystem {
  constructor(maxParticles = 160, maxShockwaves = 16) {
    this.maxParticles = maxParticles;
    this.maxShockwaves = maxShockwaves;
    this.maxArcs = 20;

    // Fixed pre-allocated memory pool (Zero Garbage Collection spikes)
    this.particles = new Array(maxParticles);
    for (let i = 0; i < maxParticles; i++) {
      this.particles[i] = {
        active: false,
        x: 0, y: 0,
        vx: 0, vy: 0,
        gravity: 0,
        drag: 1.0,
        radius: 0,
        color: '#ffffff',
        alpha: 1.0,
        decay: 1.0,
        type: 'spark',
        rotation: 0,
        rotSpeed: 0,
        scaleX: 1,
        scaleY: 1
      };
    }

    this.shockwaves = new Array(maxShockwaves);
    for (let i = 0; i < maxShockwaves; i++) {
      this.shockwaves[i] = {
        active: false,
        x: 0, y: 0,
        radius: 0,
        maxRadius: 0,
        growth: 0,
        color: '#ffffff',
        alpha: 1.0,
        decay: 1.0,
        lineWidth: 2.0
      };
    }

    this.lightningArcs = new Array(this.maxArcs);
    for (let i = 0; i < this.maxArcs; i++) {
      this.lightningArcs[i] = {
        active: false,
        points: [{ x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }],
        color: '#00f2fe',
        alpha: 1.0,
        decay: 4.5,
        lineWidth: 3.0
      };
    }
  }

  reset() {
    if (this.particles) {
      for (let i = 0; i < this.maxParticles; i++) {
        if (this.particles[i]) this.particles[i].active = false;
      }
    }
    if (this.shockwaves) {
      for (let i = 0; i < this.maxShockwaves; i++) {
        if (this.shockwaves[i]) this.shockwaves[i].active = false;
      }
    }
    if (this.lightningArcs) {
      for (let i = 0; i < this.maxArcs; i++) {
        if (this.lightningArcs[i]) this.lightningArcs[i].active = false;
      }
    }
  }

  spawnParticle() {
    for (let i = 0; i < this.maxParticles; i++) {
      if (!this.particles[i].active) {
        this.particles[i].active = true;
        return this.particles[i];
      }
    }
    return null;
  }

  spawnShockwave() {
    for (let i = 0; i < this.maxShockwaves; i++) {
      if (!this.shockwaves[i].active) {
        this.shockwaves[i].active = true;
        return this.shockwaves[i];
      }
    }
    return null;
  }

  // 1. Acoustic Grand Piano Warm Golden Flash & Radiant Sparks
  emitHit(x, y, color = '#ffdf9e', count = 8) {
    const goldPalette = ['#ffdf9e', '#ffd700', '#fff4d1', '#f5cb6c', '#ffffff', '#00f5a0'];
    for (let i = 0; i < count; i++) {
      const p = this.spawnParticle();
      if (!p) break;

      const angle = Math.random() * Math.PI * 2;
      const speed = 80 + Math.random() * 220;

      p.x = x;
      p.y = y;
      p.vx = Math.cos(angle) * speed;
      p.vy = Math.sin(angle) * speed - 25;
      p.gravity = 40;
      p.drag = 0.95;
      p.radius = 1.8 + Math.random() * 3.0;
      p.color = (color === '#00f2fe' || !color) ? goldPalette[Math.floor(Math.random() * goldPalette.length)] : color;
      p.alpha = 1.0;
      p.decay = 2.4 + Math.random() * 1.5;
      p.type = Math.random() < 0.4 ? 'glitter_star' : 'spark';
      p.rotation = Math.random() * Math.PI * 2;
      p.rotSpeed = (Math.random() - 0.5) * 8;
      p.scaleX = 1;
      p.scaleY = 1;
    }

    const sw = this.spawnShockwave();
    if (sw) {
      sw.x = x;
      sw.y = y;
      sw.radius = 8;
      sw.maxRadius = 70;
      sw.growth = 15.0;
      sw.color = (color === '#00f2fe' || !color) ? '#ffdf9e' : color;
      sw.alpha = 0.95;
      sw.decay = 3.6;
      sw.lineWidth = 2.5;
    }
  }

  // Lluvia de brillantitos continuos y diamantes estelares en Holds
  emitHoldSparks(x, y, color = '#ffe082', count = 6) {
    const glitterPal = [color, '#ffffff', '#fff7d6', '#ffd700', '#00f5a0', '#00f2fe', '#ff00aa'];
    const safeCount = Math.min(count, 8);
    for (let i = 0; i < safeCount; i++) {
      const p = this.spawnParticle();
      if (!p) break;

      const angle = -Math.PI / 2 + (Math.random() - 0.5) * 2.2;
      const speed = 70 + Math.random() * 240;

      p.x = x + (Math.random() - 0.5) * 28;
      p.y = y + (Math.random() - 0.5) * 10;
      p.vx = Math.cos(angle) * speed;
      p.vy = Math.sin(angle) * speed - 35;
      p.gravity = 110;
      p.drag = 0.94;
      p.radius = 2.2 + Math.random() * 3.2;
      p.color = glitterPal[Math.floor(Math.random() * glitterPal.length)];
      p.alpha = 1.0;
      p.decay = 2.8 + Math.random() * 1.8;
      p.type = Math.random() < 0.65 ? 'glitter_star' : (Math.random() < 0.5 ? 'diamond_spark' : 'spark');
      p.rotation = Math.random() * Math.PI * 2;
      p.rotSpeed = (Math.random() - 0.5) * 12;
      p.scaleX = 1;
      p.scaleY = 1;
    }

    if (Math.random() < 0.60) {
      const sw = this.spawnShockwave();
      if (sw) {
        sw.x = x;
        sw.y = y;
        sw.radius = 6;
        sw.maxRadius = 45;
        sw.growth = 26.0;
        sw.color = color;
        sw.alpha = 0.85;
        sw.decay = 4.2;
        sw.lineWidth = 2.0;
      }
    }

    // Micro-onda expansiva de choque de contacto en el receptor
    if (Math.random() < 0.45) {
      const sw = this.spawnShockwave();
      if (sw) {
        sw.x = x;
        sw.y = y;
        sw.radius = 4;
        sw.maxRadius = 38;
        sw.growth = 24.0;
        sw.color = color;
        sw.alpha = 0.90;
        sw.decay = 5.5;
        sw.lineWidth = 2.0;
      }
    }
  }

  emitHoldSpark(x, y, color = '#ffe082') {
    this.emitHoldSparks(x, y, color, 3);
  }

  // Celebración de Estrella Desbloqueada: Shockwave circular + 8 chispas en caída parabólica aditiva
  emitStarCelebration(x, y, isPlatinum = false) {
    const pal = isPlatinum 
      ? ['#ffffff', '#a5f3fc', '#e0f2fe', '#ffffff', '#38bdf8'] 
      : ['#fff0c2', '#e5b869', '#ffd700', '#f3d791', '#ffffff'];
    
    // 8 chispas aditivas con trayectoria parabólica descendente
    for (let i = 0; i < 8; i++) {
      const p = this.spawnParticle();
      if (!p) break;
      const angle = (Math.PI * 0.15) + (Math.random() * Math.PI * 0.7); // Dispersión angular lateral/inferior
      const speed = 75 + Math.random() * 115;
      p.x = x + (Math.random() - 0.5) * 14;
      p.y = y;
      p.vx = Math.cos(angle) * speed;
      p.vy = Math.sin(angle) * speed - 20;
      p.gravity = 220; // Caída parabólica pronunciada hacia abajo
      p.drag = 0.95;
      p.radius = 2.2 + Math.random() * 1.8;
      p.color = pal[Math.floor(Math.random() * pal.length)];
      p.alpha = 1.0;
      p.decay = 2.0 + Math.random() * 0.8;
      p.type = 'spark';
      p.rotation = 0;
      p.rotSpeed = 0;
      p.scaleX = 1;
      p.scaleY = 1;
    }

    // Micro-onda expansiva (shockwave) circular desde el nodo de la estrella
    const sw = this.spawnShockwave();
    if (sw) {
      sw.x = x;
      sw.y = y;
      sw.radius = 6;
      sw.maxRadius = 45;
      sw.growth = 16.0;
      sw.color = isPlatinum ? '#ffffff' : '#e5b869';
      sw.alpha = 1.0;
      sw.decay = 4.2;
      sw.lineWidth = 2.5;
    }
  }

  // 2. EFECTO 1: CHORROS DE PINTURA NEÓN (SPLASH / SPLATTER)
  emitPaintSplash(x, y, count = 30) {
    const paintPalette = [
      '#ff007f', // Vivid Magenta
      '#00f2fe', // Electric Cyan
      '#ffe600', // Neon Yellow
      '#39ff14', // Acid Lime
      '#b142ff', // Purple Neon
      '#ff3366'  // Coral Splat
    ];

    for (let i = 0; i < count; i++) {
      const p = this.spawnParticle();
      if (!p) break;

      const angle = (Math.random() - 0.5) * Math.PI * 1.6 - Math.PI / 2; // Upward-biased radial fan
      const speed = 80 + Math.random() * 220;
      const col = paintPalette[Math.floor(Math.random() * paintPalette.length)];

      p.x = x + (Math.random() - 0.5) * 16;
      p.y = y + (Math.random() - 0.5) * 8;
      p.vx = Math.cos(angle) * speed;
      p.vy = Math.sin(angle) * speed;
      p.gravity = 240; // Quick downward fall
      p.drag = 0.93;    // Liquid air resistance
      p.radius = 2.5 + Math.random() * 4.5;
      p.color = col;
      p.alpha = 1.0;
      p.decay = 2.8 + Math.random() * 1.2; // Quick fade (300-380ms)
      p.type = 'paint_drop';
      p.rotation = angle + Math.PI / 2;
      p.rotSpeed = (Math.random() - 0.5) * 4.0;
      p.scaleX = 0.85 + Math.random() * 0.4;
      p.scaleY = 1.2 + Math.random() * 0.8; // Elongated paint splatter tear
    }

    const sw = this.spawnShockwave();
    if (sw) {
      sw.x = x;
      sw.y = y;
      sw.radius = 10;
      sw.maxRadius = 75;
      sw.growth = 14.0;
      sw.color = paintPalette[Math.floor(Math.random() * paintPalette.length)];
      sw.alpha = 0.95;
      sw.decay = 3.6;
      sw.lineWidth = 3.0;
    }
  }

  // 3. EFECTO 2: MODO FUEGO / INFIERNO (FIRE EFFECT)
  emitFireInferno(x, y, count = 32) {
    const fireColors = ['#ffffff', '#ffea00', '#ff8800', '#ff3300', '#ff0033'];

    for (let i = 0; i < count; i++) {
      const p = this.spawnParticle();
      if (!p) break;

      const angle = -Math.PI / 2 + (Math.random() - 0.5) * 1.1; // Rising flame column
      const speed = 90 + Math.random() * 240;
      const col = fireColors[Math.floor(Math.random() * fireColors.length)];

      p.x = x + (Math.random() - 0.5) * 22;
      p.y = y + (Math.random() - 0.5) * 8;
      p.vx = Math.cos(angle) * speed;
      p.vy = Math.sin(angle) * speed - 60; // Powerful upward lift
      p.gravity = -80; // Anti-gravity buoyancy for fire embers
      p.drag = 0.94;
      p.radius = 3.0 + Math.random() * 5.0;
      p.color = col;
      p.alpha = 0.95;
      p.decay = 2.6 + Math.random() * 1.4;
      p.type = 'fire_ember';
      p.rotation = Math.random() * Math.PI * 2;
      p.rotSpeed = (Math.random() - 0.5) * 6.0;
      p.scaleX = 1;
      p.scaleY = 1.3;
    }

    const sw = this.spawnShockwave();
    if (sw) {
      sw.x = x;
      sw.y = y;
      sw.radius = 8;
      sw.maxRadius = 80;
      sw.growth = 13.0;
      sw.color = '#ff6600';
      sw.alpha = 0.9;
      sw.decay = 3.8;
      sw.lineWidth = 2.5;
    }
  }

  spawnLightningArc(startX, startY, endX, endY, color = '#00f2fe') {
    if (!this.lightningArcs) return null;
    for (let i = 0; i < this.maxArcs; i++) {
      const arc = this.lightningArcs[i];
      if (!arc.active) {
        arc.active = true;
        arc.color = color;
        arc.alpha = 0.95;
        arc.decay = 5.0; // Quick snappy lightning flash
        arc.lineWidth = 2.5 + Math.random() * 2.0;

        const numPts = arc.points.length;
        arc.points[0].x = startX;
        arc.points[0].y = startY;
        arc.points[numPts - 1].x = endX;
        arc.points[numPts - 1].y = endY;

        const dx = (endX - startX) / (numPts - 1);
        const dy = (endY - startY) / (numPts - 1);
        const normalX = -dy;
        const normalY = dx;
        const len = Math.hypot(normalX, normalY) || 1;

        for (let j = 1; j < numPts - 1; j++) {
          const jitter = (Math.random() - 0.5) * 50;
          arc.points[j].x = startX + dx * j + (normalX / len) * jitter;
          arc.points[j].y = startY + dy * j + (normalY / len) * jitter;
        }
        return arc;
      }
    }
    return null;
  }

  // 4. FULL FOCUS: FUEGOS ARTIFICIALES (Múltiples salvas a pantalla completa con física de gravedad)
  emitFullFocusFireworks(x, y, color = '#00f2fe', width = 360, height = 740) {
    const burstPositions = [
      { x: x, y: y, count: 28, speed: 260 },
      { x: width * 0.22, y: height * 0.22, count: 22, speed: 230 },
      { x: width * 0.78, y: height * 0.26, count: 22, speed: 230 },
      { x: width * 0.50, y: height * 0.45, count: 24, speed: 240 }
    ];

    for (let bIdx = 0; bIdx < burstPositions.length; bIdx++) {
      const b = burstPositions[bIdx];
      for (let i = 0; i < b.count; i++) {
        const p = this.spawnParticle();
        if (!p) break;

        const angle = Math.random() * Math.PI * 2;
        const speed = 75 + Math.random() * b.speed;

        p.x = b.x;
        p.y = b.y;
        p.vx = Math.cos(angle) * speed;
        p.vy = Math.sin(angle) * speed - 50;
        p.gravity = 320; // Gravitational descent
        p.drag = 0.94;
        p.radius = 2.2 + Math.random() * 3.5;
        p.color = color;
        p.alpha = 1.0;
        p.decay = 2.2 + Math.random() * 1.2;
        p.type = 'spark';
        p.rotation = 0;
        p.rotSpeed = 0;
        p.scaleX = 1;
        p.scaleY = 1;
      }

      const sw = this.spawnShockwave();
      if (sw) {
        sw.x = b.x;
        sw.y = b.y;
        sw.radius = 6;
        sw.maxRadius = 75;
        sw.growth = 16.0;
        sw.color = color;
        sw.alpha = 0.9;
        sw.decay = 4.0;
        sw.lineWidth = 2.5;
      }
    }
  }

  // 5. FULL FOCUS: AROS ELÉCTRICOS (Ondas de choque gigantes a pantalla completa y arcos eléctricos)
  emitFullFocusElectric(x, y, color = '#00f2fe', width = 360, height = 740) {
    const maxScreen = Math.max(width, height) * 1.35;

    // 1. Aros eléctricos gigantes concéntricos que superan los bordes de la pantalla
    for (let i = 0; i < 3; i++) {
      const sw = this.spawnShockwave();
      if (sw) {
        sw.x = (i === 0) ? x : width / 2;
        sw.y = (i === 0) ? y : height * 0.55;
        sw.radius = 8 + i * 20;
        sw.maxRadius = maxScreen;
        sw.growth = 38.0 + i * 10;
        sw.color = color;
        sw.alpha = 0.95;
        sw.decay = 3.6;
        sw.lineWidth = 4.0 - i * 0.8;
      }
    }

    // 2. Arcos eléctricos ramificados a lo largo de toda la pantalla
    this.spawnLightningArc(0, height * 0.20, width, height * 0.85, color);
    this.spawnLightningArc(width, height * 0.15, 0, height * 0.80, color);
    this.spawnLightningArc(width * 0.15, 0, x, y, color);
    this.spawnLightningArc(width * 0.85, 0, x, y, color);

    // 3. Chispas de impacto de alta energía
    for (let i = 0; i < 18; i++) {
      const p = this.spawnParticle();
      if (!p) break;
      const angle = (i / 18) * Math.PI * 2;
      const speed = 140 + Math.random() * 220;
      p.x = x;
      p.y = y;
      p.vx = Math.cos(angle) * speed;
      p.vy = Math.sin(angle) * speed;
      p.gravity = 0;
      p.drag = 0.91;
      p.radius = 2.0 + Math.random() * 2.5;
      p.color = '#ffffff';
      p.alpha = 1.0;
      p.decay = 3.5;
      p.type = 'spark';
      p.rotation = 0;
      p.rotSpeed = 0;
      p.scaleX = 1;
      p.scaleY = 1;
    }
  }

  emitBurst(x, y, color = '#ffe082', count = 20) {
    this.emitHit(x, y, color, Math.min(count, 18));
  }

  emitSwipeBurst(x, y, direction = 'up', color = '#ffd700', count = 36) {
    const swipePalette = [color, '#ffffff', '#fff7d6', '#00f2fe', '#ffd700'];
    for (let i = 0; i < count; i++) {
      const p = this.spawnParticle();
      if (!p) break;

      let baseAngle = -Math.PI / 2;
      if (direction === 'down') baseAngle = Math.PI / 2;
      else if (direction === 'left') baseAngle = Math.PI;
      else if (direction === 'right') baseAngle = 0;

      const angle = baseAngle + (Math.random() - 0.5) * 0.9;
      const speed = 220 + Math.random() * 480; // Hipersónico

      p.x = x + (Math.random() - 0.5) * 20;
      p.y = y + (Math.random() - 0.5) * 10;
      p.vx = Math.cos(angle) * speed;
      p.vy = Math.sin(angle) * speed;
      p.gravity = 0;
      p.drag = 0.95;
      p.radius = 2.4 + Math.random() * 3.8;
      p.color = swipePalette[Math.floor(Math.random() * swipePalette.length)];
      p.alpha = 1.0;
      p.decay = 2.4 + Math.random() * 1.8;
      p.type = Math.random() < 0.55 ? 'glitter_star' : (Math.random() < 0.4 ? 'diamond_spark' : 'spark');
      p.rotation = Math.random() * Math.PI * 2;
      p.rotSpeed = (Math.random() - 0.5) * 16;
      p.scaleX = 1;
      p.scaleY = 1;
    }

    const sw = this.spawnShockwave();
    if (sw) {
      sw.x = x;
      sw.y = y;
      sw.radius = 12;
      sw.maxRadius = 95;
      sw.growth = 22.0;
      sw.color = color;
      sw.alpha = 1.0;
      sw.decay = 3.8;
      sw.lineWidth = 3.2;
    }
  }

  emitHoldSpark(x, y, color = '#ffe082') {
    const pal = [color, '#ffffff', '#fff7d6', '#ffd700', '#00f2fe', '#ff00aa'];
    for (let i = 0; i < 5; i++) {
      const p = this.spawnParticle();
      if (!p) break;

      const angle = (Math.random() - 0.5) * Math.PI * 1.6 - Math.PI / 2;
      const speed = 60 + Math.random() * 160;

      p.x = x + (Math.random() - 0.5) * 24;
      p.y = y + (Math.random() - 0.5) * 8;
      p.vx = Math.cos(angle) * speed;
      p.vy = Math.sin(angle) * speed - 15;
      p.gravity = 70;
      p.drag = 0.95;
      p.radius = 1.8 + Math.random() * 2.8;
      p.color = pal[Math.floor(Math.random() * pal.length)];
      p.alpha = 1.0;
      p.decay = 3.0 + Math.random() * 1.5;
      p.type = Math.random() < 0.7 ? 'glitter_star' : 'diamond_spark';
      p.rotation = Math.random() * Math.PI * 2;
      p.rotSpeed = (Math.random() - 0.5) * 10;
      p.scaleX = 1;
      p.scaleY = 1;
    }
  }

  // 1. EXCLUSIVO 3D: CHISPAS DE LATÓN REAL (Royal Brass Sparks & Embers)
  emitRoyalBrass(x, y, count = 28) {
    const brassPalette = ['#fff3cf', '#ffd700', '#c5a059', '#e6af34', '#ffffff', '#f59e0b'];
    for (let i = 0; i < count; i++) {
      const p = this.spawnParticle();
      if (!p) break;
      const angle = (Math.random() - 0.5) * Math.PI * 1.5 - Math.PI / 2;
      const speed = 90 + Math.random() * 240;
      p.x = x + (Math.random() - 0.5) * 12;
      p.y = y + (Math.random() - 0.5) * 6;
      p.vx = Math.cos(angle) * speed;
      p.vy = Math.sin(angle) * speed;
      p.gravity = 180;
      p.drag = 0.94;
      p.radius = 1.8 + Math.random() * 3.2;
      p.color = brassPalette[Math.floor(Math.random() * brassPalette.length)];
      p.alpha = 1.0;
      p.decay = 2.4 + Math.random() * 1.6;
      p.type = 'spark';
      p.rotation = Math.random() * Math.PI * 2;
      p.rotSpeed = (Math.random() - 0.5) * 12;
      p.scaleX = 1;
      p.scaleY = 1;
    }
    const sw = this.spawnShockwave();
    if (sw) {
      sw.x = x;
      sw.y = y;
      sw.radius = 10;
      sw.maxRadius = 75;
      sw.growth = 16.0;
      sw.color = '#ffd700';
      sw.alpha = 1.0;
      sw.decay = 3.5;
      sw.lineWidth = 3.2;
    }
  }

  // 2. EXCLUSIVO 3D: RESONANCIA ARMÓNICA (Acoustic Standing Waves)
  emitAcousticResonance(x, y) {
    const sw1 = this.spawnShockwave();
    if (sw1) {
      sw1.x = x;
      sw1.y = y;
      sw1.radius = 6;
      sw1.maxRadius = 90;
      sw1.growth = 18.0;
      sw1.color = '#ffe082';
      sw1.alpha = 1.0;
      sw1.decay = 3.2;
      sw1.lineWidth = 3.5;
    }
    const sw2 = this.spawnShockwave();
    if (sw2) {
      sw2.x = x;
      sw2.y = y;
      sw2.radius = 2;
      sw2.maxRadius = 130;
      sw2.growth = 12.0;
      sw2.color = '#c5a059';
      sw2.alpha = 0.8;
      sw2.decay = 2.0;
      sw2.lineWidth = 2.0;
    }
    const goldTones = ['#fff8db', '#f3d791', '#d4af37', '#ffffff'];
    for (let i = 0; i < 16; i++) {
      const p = this.spawnParticle();
      if (!p) break;
      const angle = Math.random() * Math.PI * 2;
      const speed = 35 + Math.random() * 110;
      p.x = x;
      p.y = y;
      p.vx = Math.cos(angle) * speed;
      p.vy = Math.sin(angle) * speed - 15;
      p.gravity = -20;
      p.drag = 0.96;
      p.radius = 1.4 + Math.random() * 2.2;
      p.color = goldTones[Math.floor(Math.random() * goldTones.length)];
      p.alpha = 0.95;
      p.decay = 1.8 + Math.random() * 1.2;
      p.type = 'spark';
    }
  }

  // 3. EXCLUSIVO 3D: FUEGO CARMESÍ & TERCIOPELO (Crimson Damper Royale)
  emitCrimsonRoyale(x, y, count = 26) {
    const crimsonPalette = ['#85141d', '#b91c1c', '#dc2626', '#ffd700', '#fff3cf', '#f87171'];
    for (let i = 0; i < count; i++) {
      const p = this.spawnParticle();
      if (!p) break;
      const angle = (Math.random() - 0.5) * Math.PI * 1.6 - Math.PI / 2;
      const speed = 70 + Math.random() * 180;
      p.x = x + (Math.random() - 0.5) * 14;
      p.y = y;
      p.vx = Math.cos(angle) * speed;
      p.vy = Math.sin(angle) * speed;
      p.gravity = 60;
      p.drag = 0.95;
      p.radius = 2.0 + Math.random() * 3.5;
      p.color = crimsonPalette[Math.floor(Math.random() * crimsonPalette.length)];
      p.alpha = 1.0;
      p.decay = 2.0 + Math.random() * 1.4;
      p.type = 'spark';
    }
    const sw = this.spawnShockwave();
    if (sw) {
      sw.x = x;
      sw.y = y;
      sw.radius = 8;
      sw.maxRadius = 80;
      sw.growth = 15.0;
      sw.color = '#e11d48';
      sw.alpha = 0.9;
      sw.decay = 3.0;
      sw.lineWidth = 3.0;
    }
  }

  // 4. EXCLUSIVO 3D: MARFIL CENITAL (Luminous Zenith Ivory)
  emitLuminousIvory(x, y, count = 25) {
    const ivoryPalette = ['#ffffff', '#fdfbf7', '#fff8e7', '#fef3c7', '#ffd700', '#f5e6d3'];
    for (let i = 0; i < count; i++) {
      const p = this.spawnParticle();
      if (!p) break;
      const angle = Math.random() * Math.PI * 2;
      const speed = 60 + Math.random() * 200;
      p.x = x;
      p.y = y;
      p.vx = Math.cos(angle) * speed;
      p.vy = Math.sin(angle) * speed - 20;
      p.gravity = 25;
      p.drag = 0.94;
      p.radius = 2.0 + Math.random() * 3.0;
      p.color = ivoryPalette[Math.floor(Math.random() * ivoryPalette.length)];
      p.alpha = 1.0;
      p.decay = 2.2 + Math.random() * 1.5;
      p.type = 'spark';
    }
    const sw = this.spawnShockwave();
    if (sw) {
      sw.x = x;
      sw.y = y;
      sw.radius = 12;
      sw.maxRadius = 85;
      sw.growth = 17.0;
      sw.color = '#ffffff';
      sw.alpha = 1.0;
      sw.decay = 3.8;
      sw.lineWidth = 3.5;
    }
  }

  update(dt) {
    if (!this.particles || !this.shockwaves) return;
    for (let i = 0; i < this.maxParticles; i++) {
      const p = this.particles[i];
      if (!p || !p.active) continue;

      p.vx *= Math.pow(p.drag, dt * 60);
      p.vy = (p.vy + p.gravity * dt) * Math.pow(p.drag, dt * 60);
      p.x += p.vx * dt;
      p.y += p.vy * dt;

      if (p.rotSpeed) {
        p.rotation += p.rotSpeed * dt;
      }

      p.alpha -= p.decay * dt;
      if (p.alpha <= 0) {
        p.active = false;
      }
    }

    for (let i = 0; i < this.maxShockwaves; i++) {
      const s = this.shockwaves[i];
      if (!s || !s.active) continue;

      s.radius += (s.maxRadius - s.radius) * s.growth * dt;
      s.alpha -= s.decay * dt;
      if (s.alpha <= 0) {
        s.active = false;
      }
    }

    if (this.lightningArcs) {
      for (let i = 0; i < this.maxArcs; i++) {
        const a = this.lightningArcs[i];
        if (!a || !a.active) continue;
        a.alpha -= a.decay * dt;
        if (a.alpha <= 0) a.active = false;
      }
    }
  }

  render(ctx) {
    if (!this.particles || !this.shockwaves || !ctx) return;
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    for (let i = 0; i < this.maxParticles; i++) {
      const p = this.particles[i];
      if (!p || !p.active || p.alpha <= 0.01) continue;

      ctx.globalAlpha = Math.max(0, Math.min(1, p.alpha));
      ctx.fillStyle = p.color;

      if (p.type === 'glitter_star') {
        // Estrella diamante ✦ de 4 puntas ultra-brillante
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rotation);
        const rOuter = Math.max(2.0, p.radius * 2.2);
        const rInner = rOuter * 0.22;
        ctx.beginPath();
        for (let pt = 0; pt < 8; pt++) {
          const rCur = (pt % 2 === 0) ? rOuter : rInner;
          const aCur = (pt / 8) * Math.PI * 2;
          const px = Math.cos(aCur) * rCur;
          const py = Math.sin(aCur) * rCur;
          if (pt === 0) ctx.moveTo(px, py);
          else ctx.lineTo(px, py);
        }
        ctx.closePath();
        ctx.fillStyle = p.color;
        ctx.fill();

        // Núcleo blanco diamantino
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(0, 0, rInner * 1.2, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      } else if (p.type === 'diamond_spark') {
        // Micro-diamante facetado ◆
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rotation);
        const dW = p.radius * 1.6;
        const dH = p.radius * 2.2;
        ctx.beginPath();
        ctx.moveTo(0, -dH);
        ctx.lineTo(dW, 0);
        ctx.lineTo(0, dH);
        ctx.lineTo(-dW, 0);
        ctx.closePath();
        ctx.fillStyle = p.color;
        ctx.fill();
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 0.8;
        ctx.stroke();
        ctx.restore();
      } else if (p.type === 'paint_drop') {
        // Render stylized tear/droplet of paint
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rotation);
        ctx.scale(p.scaleX, p.scaleY);
        ctx.beginPath();
        ctx.arc(0, 0, p.radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      } else if (p.type === 'fire_ember') {
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius * (0.6 + p.alpha * 0.4), 0, Math.PI * 2);
        ctx.fill();
      } else {
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    for (let i = 0; i < this.maxShockwaves; i++) {
      const s = this.shockwaves[i];
      if (!s.active || s.alpha <= 0.01) continue;

      ctx.globalAlpha = Math.max(0, Math.min(1, s.alpha));
      ctx.strokeStyle = s.color;
      ctx.lineWidth = s.lineWidth || 2.0;
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.radius, 0, Math.PI * 2);
      ctx.stroke();
    }

    if (this.lightningArcs) {
      for (let i = 0; i < this.maxArcs; i++) {
        const a = this.lightningArcs[i];
        if (!a || !a.active || a.alpha <= 0.01) continue;

        ctx.globalAlpha = Math.max(0, Math.min(1, a.alpha));
        ctx.strokeStyle = a.color;
        ctx.lineWidth = a.lineWidth || 2.5;
        ctx.beginPath();
        ctx.moveTo(a.points[0].x, a.points[0].y);
        for (let j = 1; j < a.points.length; j++) {
          ctx.lineTo(a.points[j].x, a.points[j].y);
        }
        ctx.stroke();

        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = Math.max(1, (a.lineWidth || 2.5) * 0.4);
        ctx.stroke();
      }
    }
    ctx.restore();
  }
}

// ==========================================
// 3-LANE FIXED BEATSTAR ENGINE
// ==========================================

class BeatstarEngine {
  constructor(canvas, uiCallbacks) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d', { alpha: true });
    this.ui = uiCallbacks;

    // Cap resolution scaling at 2x max for 120 FPS mobile GPU efficiency
    this.dpr = Math.min(typeof window !== 'undefined' ? (window.devicePixelRatio || 1) : 1, 2);
    this.width = 0;
    this.height = 0;
    this.numLanes = 3; // Fixed strictly to 3 vertical lanes
    this.laneWidth = 0;
    this.hitLineY = 0;
    this.baseScrollDurationMs = 1200;
    this.noteSpeedMultiplier = parseFloat(typeof localStorage !== 'undefined' ? (localStorage.getItem('beatstar_note_speed') || '1.0') : '1.0') || 1.0;
    this.songPlaybackRate = 1.0;
    this.scrollDurationMs = Math.round(this.baseScrollDurationMs / Math.max(0.5, Math.min(2.5, this.noteSpeedMultiplier)));

    this.notes = [];
    this.activeHolds = new Map();
    this.activeTouches = new Map();
    this.laneGlows = [0, 0, 0];
    this.fxRipples = [];
    this.bgBursts = [];
    this.musicalNotes = [];
    this.topComboToast = null;
    this.combo3DExplosions = [];
    this.activeAtmosphereColor = null;
    this.targetAtmosphereColor = null;
    this.atmosphereShiftProgress = 1.0;
    this.speedStreaks = [];

    // Key FX Theme (default_neon, color_burst, spotlight_reveal)
    this.activeEffect = (typeof localStorage !== 'undefined' ? localStorage.getItem('beatstar_active_effect') : null) || 'default_neon';
    this.latencyOffsetMs = parseInt(typeof localStorage !== 'undefined' ? (localStorage.getItem('beatstar_offset') || '0') : '0', 10) || 0;

    // Custom Background & Reactive Illumination System
    this.customBgMode = (typeof localStorage !== 'undefined' ? localStorage.getItem('beatstar_bg_mode') : null) || 'black';
    this.customBgOpacity = parseFloat(typeof localStorage !== 'undefined' ? (localStorage.getItem('beatstar_bg_opacity') || '0.40') : '0.40') || 0.40;
    this.customBgCropX = parseFloat(typeof localStorage !== 'undefined' ? (localStorage.getItem('beatstar_bg_crop_x') || '0.5') : '0.5');
    this.customBgCropY = parseFloat(typeof localStorage !== 'undefined' ? (localStorage.getItem('beatstar_bg_crop_y') || '0.5') : '0.5');
    this.customBgZoom = parseFloat(typeof localStorage !== 'undefined' ? (localStorage.getItem('beatstar_bg_crop_zoom') || '1.0') : '1.0');
    this.customBgFit = (typeof localStorage !== 'undefined' ? (localStorage.getItem('beatstar_bg_fit') || 'cover') : 'cover');
    this.customBgMedia = null;
    this.customBgMediaType = null; // 'image' or 'video'
    this.customBgVideo = null;
    this.reactiveLightBoost = 0;
    this.lastHitColor = '#00f2fe';
    this.spotlightCanvas = null;
    this.spotlightCtx = null;
    this.activeSwipeDrags = new Map();
    this.hudArtistPortalEl = null;

    // Bola de Discoteca Plateada Hiperrealista y Sistema de Iluminación Volumétrica (Combo >= 200)
    this.discoBall = {
      active: false,
      descendY: -120,      // Oculta en el techo por defecto
      targetY: -120,       // Solo desciende a 86px al alcanzar combo 200
      radius: 27,          // Radio de la esfera en píxeles
      rotation: 0,         // Rotación sobre el eje vertical
      rotSpeed: 0.85,      // Velocidad base de giro (rad/s)
      latBands: 13,        // Bandas de latitud de azulejos de espejo
      lonSegments: 26,     // Segmentos de longitud
      specks: [],          // Reflejos difuminados de espejos flotando por toda la pantalla
      spotlights: [
        { x: -0.65, y: -0.55, z: 0.52, color: '#ffffff', rgb: { r: 255, g: 255, b: 255 }, power: 1.1 },
        { x: 0.70, y: -0.45, z: 0.55, color: '#00f2fe', rgb: { r: 0, g: 242, b: 254 }, power: 0.95 },
        { x: -0.25, y: -0.75, z: 0.60, color: '#ff007f', rgb: { r: 255, g: 0, b: 127 }, power: 1.0 },
        { x: 0.40, y: -0.60, z: 0.70, color: '#fbbf24', rgb: { r: 251, g: 191, b: 36 }, power: 0.9 }
      ]
    };
    for (let i = 0; i < 90; i++) {
      this.discoBall.specks.push({
        theta: Math.random() * Math.PI * 2,
        phi: (Math.random() - 0.5) * Math.PI * 0.88,
        dist: 0.12 + Math.random() * 0.90,
        size: 3.5 + Math.random() * 8.0,
        speed: 0.35 + Math.random() * 0.95,
        colorIdx: Math.floor(Math.random() * 6),
        brightness: 0.45 + Math.random() * 0.55,
        shimmerPhase: Math.random() * Math.PI * 2,
        shimmerSpeed: 4.0 + Math.random() * 8.0
      });
    }

    // PC Controls & Detection
    this.isPCMode = (typeof window !== 'undefined') && (!('ontouchstart' in window) && (navigator.maxTouchPoints === 0 || (window.matchMedia && window.matchMedia('(pointer: fine)').matches)));
    const savedKeybinds = (typeof localStorage !== 'undefined') ? localStorage.getItem('beatstar_pc_keybinds') : null;
    this.pcKeybinds = savedKeybinds ? JSON.parse(savedKeybinds) : { 0: 'd', 1: 'f', 2: 'j' };
    this.initCustomBackground();

    // Scoring & Multiplier
    this.score = 0;
    this.displayScore = 0;
    this.combo = 0;
    this.maxCombo = 0;
    this.streakCount = 0;
    this.multiplier = 1;
    this.stars = 0;
    this.lastCelebratedStar = 0;
    this.targetScore = 100000;
    this.missCount = 0;
    this.invulnerableUntil = 0;
    this.isInitialLaunch = true;
    this.isRewinding = false;
    this.isCountingDown = false;
    const savedContinueMode = typeof localStorage !== 'undefined' ? localStorage.getItem('beatstar_continue_mode') : null;
    this.continueMode = (savedContinueMode === 'true' || savedContinueMode === true);
    this.judgements = [];
    this.stats = { perfectPlus: 0, perfect: 0, great: 0, miss: 0 };
    this.vignetteAlpha = 0;
    this.vignetteColor = '#e5b869';

    // Master Volume & Mute
    const savedMasterVol = parseFloat(typeof localStorage !== 'undefined' ? (localStorage.getItem('beatstar_master_volume') ?? '1.0') : '1.0');
    const savedMasterMuted = typeof localStorage !== 'undefined' && localStorage.getItem('beatstar_master_muted') === 'true';
    this.masterVolume = isNaN(savedMasterVol) ? 1.0 : Math.max(0, Math.min(1, savedMasterVol));
    this.masterMuted = savedMasterMuted;

    // Custom judgment colors: Paleta metálica noble de concierto
    // PERFECT+ blanco (#ffffff con halo #fff0c2) | PERFECT oro (#e5b869) | GREAT ámbar (#e08238) | GOOD bronce (#9e7b66) | MISS carmesí (#a81b26)
    const _savedJudgeColors = (() => { try { return JSON.parse(localStorage.getItem('beatstar_judge_colors') || 'null'); } catch(e) { return null; } })();
    if (_savedJudgeColors) {
      if (_savedJudgeColors.perfectPlus === '#00f2fe' || _savedJudgeColors.perfectPlus === '#ffe082') _savedJudgeColors.perfectPlus = '#ffffff';
      if (_savedJudgeColors.perfect === '#00ff88' || _savedJudgeColors.perfect === '#ffd27d') _savedJudgeColors.perfect = '#e5b869';
      if (_savedJudgeColors.great === '#ffd700') _savedJudgeColors.great = '#e08238';
      if (_savedJudgeColors.good === '#ff8800') _savedJudgeColors.good = '#9e7b66';
    }
    this.judgeColors = Object.assign({
      perfectPlus: '#ffffff',
      perfect:     '#e5b869',
      great:       '#e08238',
      good:        '#9e7b66'
    }, _savedJudgeColors || {});

    this.visualDimension = (typeof localStorage !== 'undefined' ? localStorage.getItem('beatstar_visual_dimension') : null) || '3d';
    this.keyStyle = (typeof localStorage !== 'undefined' ? localStorage.getItem('beatstar_key_style') : null) || 'beatstar_large';

    this.nextCalibNoteTime = 0;
    this.synth = new HighFidelityAudioPlayer();

    this.particles = new ParticleSystem();
    this.sync = new DirectAudioSync(
      () => this.onAudioReady(),
      () => this.onAudioEnded(),
      (msg) => this.onAudioError(msg)
    );
    this.audioSync = this.sync;

    this.lanePressAnim = [0, 0, 0];
    this.laneFlashTimers = [0, 0, 0];
    this.laneFlashColors = ['#e5b869', '#e5b869', '#e5b869'];
    this.lastHitTimePerf = 0;
    this.shakeDuration = 0;
    this.shakeIntensity = 0;

    this.initCanvasSize();
    this.bindEvents();
  }

  setMasterVolume(val, muted = false) {
    this.masterVolume = Math.max(0, Math.min(1, parseFloat(val) || 0));
    this.masterMuted = !!muted;
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem('beatstar_master_volume', this.masterVolume.toString());
      localStorage.setItem('beatstar_master_muted', this.masterMuted.toString());
    }
    if (this.sync && this.sync.setVolume) {
      this.sync.setVolume(this.masterVolume, this.masterMuted);
    }
    if (this.synth && this.synth.setVolume) {
      this.synth.setVolume(this.masterVolume, this.masterMuted);
    }
  }

  unlockAudio() {
    if (this.sync && this.sync.unlockAudio) {
      this.sync.unlockAudio();
    }
    if (this.synth && this.synth.ensureContext) {
      this.synth.ensureContext();
    }
  }

  onAudioReady() {
    console.log('[BeatstarEngine] Audio track ready and buffered.');
  }

  onAudioEnded() {
    console.log('[BeatstarEngine] Audio reached end of stream.');
    if (this.isRunning && !this.isGameOver) {
      this.triggerGameEnd();
    }
  }

  onAudioError(msg) {
    console.warn('[BeatstarEngine] Audio warning/error:', msg);
  }

  getScoreColor(type) {
    const jc = this.judgeColors || {};
    switch (type) {
      case 'perfectPlus':
      case 'PERFECT+':
        return (jc.perfectPlus && jc.perfectPlus !== '#00f2fe' && jc.perfectPlus !== '#ffe082') ? jc.perfectPlus : '#ffffff';
      case 'perfect':
      case 'PERFECT':
        return (jc.perfect && jc.perfect !== '#00ff88' && jc.perfect !== '#ffd27d') ? jc.perfect : '#e5b869';
      case 'great':
      case 'GREAT':
        return (jc.great && jc.great !== '#ffd700') ? jc.great : '#e08238';
      case 'good':
      case 'GOOD':
        return (jc.good && jc.good !== '#ff8800') ? jc.good : '#9e7b66';
      case 'miss':
      case 'MISS':
        return '#a81b26';
      default:
        return '#e5b869';
    }
  }

  setVisualDimension(dim) {
    this.visualDimension = (dim === '2d') ? '2d' : '3d';
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem('beatstar_visual_dimension', this.visualDimension);
    }
  }

  setKeyStyle(style) {
    this.keyStyle = (style === 'compact') ? 'compact' : 'beatstar_large';
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem('beatstar_key_style', this.keyStyle);
    }
  }

  emitKeyHit(x, y, color = '#ffdf9e', count = 22) {
    if (this.activeEffect === 'royal_brass') {
      this.particles.emitRoyalBrass(x, y);
    } else if (this.activeEffect === 'acoustic_resonance') {
      this.particles.emitAcousticResonance(x, y);
    } else if (this.activeEffect === 'crimson_royale') {
      this.particles.emitCrimsonRoyale(x, y);
    } else if (this.activeEffect === 'luminous_ivory') {
      this.particles.emitLuminousIvory(x, y);
    } else if (this.activeEffect === 'paint_splash') {
      this.particles.emitPaintSplash(x, y, 30);
    } else if (this.activeEffect === 'fire_inferno') {
      this.particles.emitFireInferno(x, y, 32);
    } else if (this.activeEffect === 'full_focus_base') {
      this.vignetteAlpha = 0.85;
      this.vignetteColor = color;
      this.particles.emitHit(x, y, color, 20);
    } else if (this.activeEffect === 'full_focus_fireworks') {
      this.vignetteAlpha = 0.70;
      this.vignetteColor = color;
      this.particles.emitFullFocusFireworks(x, y, color, this.width || 360, this.height || 740);
    } else if (this.activeEffect === 'full_focus_electric') {
      this.vignetteAlpha = 0.75;
      this.vignetteColor = color;
      this.particles.emitFullFocusElectric(x, y, color, this.width || 360, this.height || 740);
    } else {
      this.particles.emitHit(x, y, color, count);
    }
  }

  setActiveEffect(effectId) {
    this.activeEffect = effectId || 'default_neon';
    localStorage.setItem('beatstar_active_effect', this.activeEffect);
  }

  initCustomBackground() {
    try {
      const rawData = typeof localStorage !== 'undefined' ? localStorage.getItem('beatstar_custom_bg_data') : null;
      if (rawData) {
        if (rawData.startsWith('data:video') || rawData.endsWith('.mp4') || rawData.endsWith('.webm')) {
          this.setCustomBackground(rawData, 'video', this.customBgMode, this.customBgOpacity);
        } else {
          this.setCustomBackground(rawData, 'image', this.customBgMode, this.customBgOpacity);
        }
      }
    } catch (e) {
      console.warn('Could not load custom background from storage:', e);
    }
  }

  setCustomBackground(mediaSource, mediaType = 'image', mode = null, opacity = null) {
    if (mode !== undefined && mode !== null) {
      this.customBgMode = mode;
      localStorage.setItem('beatstar_bg_mode', mode);
    }
    if (opacity !== undefined && opacity !== null) {
      this.customBgOpacity = parseFloat(opacity) || 0.40;
      localStorage.setItem('beatstar_bg_opacity', this.customBgOpacity.toString());
    }

    if (mediaSource !== undefined && mediaSource !== null) {
      if (mediaSource === '' || mediaSource === 'none') {
        if (this.customBgVideo) {
          try { this.customBgVideo.pause(); } catch(e) {}
          this.customBgVideo = null;
        }
        this.customBgMedia = null;
        this.customBgMediaType = null;
        localStorage.removeItem('beatstar_custom_bg_data');
      } else if (mediaType === 'video' || (typeof mediaSource === 'string' && (mediaSource.startsWith('data:video') || mediaSource.includes('.mp4') || mediaSource.includes('.webm') || (mediaSource.startsWith('blob:') && mediaType !== 'image')))) {
        // HTML5 Video Element
        if (!this.customBgVideo) {
          this.customBgVideo = document.createElement('video');
          this.customBgVideo.muted = true;
          this.customBgVideo.defaultMuted = true;
          this.customBgVideo.loop = true;
          this.customBgVideo.playsInline = true;
          this.customBgVideo.setAttribute('muted', '');
          this.customBgVideo.setAttribute('playsinline', '');
          this.customBgVideo.setAttribute('webkit-playsinline', '');
          this.customBgVideo.autoplay = true;
        }
        if (typeof mediaSource === 'string' && (mediaSource.startsWith('http://') || mediaSource.startsWith('https://'))) {
          this.customBgVideo.crossOrigin = 'anonymous';
        } else {
          this.customBgVideo.removeAttribute('crossOrigin');
        }
        this.customBgVideo.src = mediaSource;
        this.customBgVideo.load();
        const p = this.customBgVideo.play();
        if (p && typeof p.catch === 'function') p.catch(() => {});
        this.customBgMedia = this.customBgVideo;
        this.customBgMediaType = 'video';
      } else {
        // HTML Image Element
        if (this.customBgVideo) {
          try { this.customBgVideo.pause(); } catch(e) {}
          this.customBgVideo = null;
        }
        const img = new Image();
        if (typeof mediaSource === 'string' && (mediaSource.startsWith('http://') || mediaSource.startsWith('https://'))) {
          img.crossOrigin = 'anonymous';
        }
        img.onload = () => {
          this.customBgMedia = img;
          this.customBgMediaType = 'image';
        };
        img.src = mediaSource;
        this.customBgMedia = img;
        this.customBgMediaType = 'image';
      }
    }
  }

  setCustomBgTransform(cropX = 0.5, cropY = 0.5, zoom = 1.0, fit = 'cover') {
    this.customBgCropX = Math.max(0, Math.min(1, parseFloat(cropX) ?? 0.5));
    this.customBgCropY = Math.max(0, Math.min(1, parseFloat(cropY) ?? 0.5));
    this.customBgZoom = Math.max(0.5, Math.min(3.0, parseFloat(zoom) ?? 1.0));
    this.customBgFit = fit || 'cover';
    localStorage.setItem('beatstar_bg_crop_x', this.customBgCropX.toString());
    localStorage.setItem('beatstar_bg_crop_y', this.customBgCropY.toString());
    localStorage.setItem('beatstar_bg_crop_zoom', this.customBgZoom.toString());
    localStorage.setItem('beatstar_bg_fit', this.customBgFit);
  }

  drawCoverMedia(ctx, media, targetW, targetH) {
    if (!media) return;
    let mw = 0;
    let mh = 0;
    if (media instanceof HTMLVideoElement) {
      mw = media.videoWidth;
      mh = media.videoHeight;
      if (media.paused && !media.ended) {
        media.play().catch(() => {});
      }
    } else if (media instanceof HTMLImageElement) {
      mw = media.naturalWidth || media.width;
      mh = media.naturalHeight || media.height;
    }
    if (!mw || !mh) return;

    const fit = this.customBgFit || 'cover';
    const zoom = Math.max(0.5, Math.min(3.0, this.customBgZoom || 1.0));
    const cropX = (this.customBgCropX !== undefined) ? this.customBgCropX : 0.5;
    const cropY = (this.customBgCropY !== undefined) ? this.customBgCropY : 0.5;

    let baseScale = (fit === 'contain') 
      ? Math.min(targetW / mw, targetH / mh)
      : Math.max(targetW / mw, targetH / mh);

    const scale = baseScale * zoom;
    const sw = mw * scale;
    const sh = mh * scale;

    const dx = (targetW - sw) * cropX;
    const dy = (targetH - sh) * cropY;

    ctx.drawImage(media, dx, dy, sw, sh);
  }

  setPCKeybind(lane, key) {
    if (lane >= 0 && lane <= 2 && key) {
      this.pcKeybinds[lane] = key.toLowerCase();
      localStorage.setItem('beatstar_pc_keybinds', JSON.stringify(this.pcKeybinds));
    }
  }

  addReactiveBurst(lane, x, y, color = '#00f2fe') {
    const hitX = (x !== undefined && x !== null) ? x : (lane + 0.5) * this.laneWidth;
    const hitY = (y !== undefined && y !== null) ? y : this.hitLineY;
    this.bgBursts.push({
      type: 'reactive_reveal',
      lane,
      x: hitX,
      y: hitY,
      radius: 40,
      maxRadius: Math.max(this.width, this.height) * 0.75,
      alpha: 1.0,
      decay: 1.6,
      color: color || '#00f2fe'
    });
    // Boost reactive ambient light: more hits = brighter scene!
    this.reactiveLightBoost = Math.min(1.0, (this.reactiveLightBoost || 0) + 0.22);
    this.lastHitColor = color || '#00f2fe';
  }

  triggerScreenShake(intensity = 2.0, durationMs = 50) {
    this.shakeIntensity = intensity;
    this.shakeDuration = durationMs / 1000;
  }

  setJudgeColors(colors) {
    this.judgeColors = Object.assign(this.judgeColors || {}, colors);
    localStorage.setItem('beatstar_judge_colors', JSON.stringify(this.judgeColors));
  }

  setLatencyOffset(offsetMs) {
    this.latencyOffsetMs = parseInt(offsetMs, 10) || 0;
    localStorage.setItem('beatstar_offset', this.latencyOffsetMs.toString());
  }

  setContinueMode(enabled) {
    this.continueMode = !!enabled;
    localStorage.setItem('beatstar_continue_mode', this.continueMode.toString());
  }

  setNoteSpeedMultiplier(multiplier) {
    this.noteSpeedMultiplier = parseFloat(multiplier) || 1.0;
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem('beatstar_note_speed', this.noteSpeedMultiplier.toString());
    }
    const base = this.baseScrollDurationMs || 1200;
    const mult = Math.max(0.5, Math.min(2.5, this.noteSpeedMultiplier));
    this.scrollDurationMs = Math.round(base / mult);
  }

  setSongPlaybackSpeed(speed) {
    const s = Math.max(0.5, Math.min(2.0, parseFloat(speed) || 1.0));
    this.songPlaybackRate = s;
    if (this.sync) {
      this.sync.setPlaybackRate(s);
    }
    if (this.audioSync && this.audioSync !== this.sync) {
      this.audioSync.setPlaybackRate(s);
    }
  }

  initCanvasSize() {
    const rect = (this.canvas && this.canvas.getBoundingClientRect) ? this.canvas.getBoundingClientRect() : { width: 360, height: 640 };
    const viewport = typeof document !== 'undefined' ? document.querySelector('.game-viewport') : null;
    const vpRect = (viewport && viewport.getBoundingClientRect) ? viewport.getBoundingClientRect() : null;

    this.width = rect.width || (vpRect ? vpRect.width : 0) || (typeof window !== 'undefined' ? window.innerWidth : 360) || 360;
    this.height = rect.height || (vpRect ? vpRect.height : 0) || (typeof window !== 'undefined' ? window.innerHeight : 640) || 640;
    this.numLanes = 3;
    this.laneWidth = this.width / 3;
    this.hitLineY = this.height * 0.82;

    this.dpr = Math.min(typeof window !== 'undefined' ? (window.devicePixelRatio || 1) : 1, 2);
    this.canvas.width = Math.round(this.width * this.dpr);
    this.canvas.height = Math.round(this.height * this.dpr);
    if (this.ctx) {
      if (typeof this.ctx.setTransform === 'function') {
        this.ctx.setTransform(1, 0, 0, 1, 0, 0);
      }
      this.ctx.scale(this.dpr, this.dpr);
    }
  }

  bindEvents() {
    window.addEventListener('resize', () => this.initCanvasSize());

    this.canvas.addEventListener('touchstart', (e) => {
      this.handleTouchStart(e);
    }, { passive: false });
    this.canvas.addEventListener('touchmove', (e) => this.handleTouchMove(e), { passive: false });
    this.canvas.addEventListener('touchend', (e) => this.handleTouchEnd(e), { passive: false });
    this.canvas.addEventListener('touchcancel', (e) => this.handleTouchEnd(e), { passive: false });

    this.canvas.addEventListener('mousedown', (e) => {
      this.handleMouseDown(e);
    });
    this.canvas.addEventListener('mousemove', (e) => this.handleMouseMove(e));
    this.canvas.addEventListener('mouseup', (e) => this.handleMouseUp(e));

    window.addEventListener('keydown', (e) => {
      if (e.repeat) return;
      if (e.key === 'Escape' || e.key === 'p' || e.key === 'P') {
        if (!this.isCalibrating && this.beatmapData) {
          if (this.isPaused) {
            if (this.ui.onResume) this.ui.onResume();
          } else {
            if (this.ui.onTogglePause) this.ui.onTogglePause();
          }
          return;
        }
      }
      if (this.isPaused || this.isRewinding || this.isCountingDown) return;

      const k = (e.key || '').toLowerCase();
      const kb = this.pcKeybinds || { 0: 'd', 1: 'f', 2: 'j' };

      if (k === (kb[0] || 'd') || k === 'a' || k === '1') this.triggerLaneInput(0, 'tap');
      else if (k === (kb[1] || 'f') || k === 's' || k === ' ' || k === '2') this.triggerLaneInput(1, 'tap');
      else if (k === (kb[2] || 'j') || k === 'k' || k === '3') this.triggerLaneInput(2, 'tap');

      const handleArrowSwipe = (dir) => {
        const currentTime = this.getCurrentGameTimeMs();
        let targetLane = -1;
        let bestDiff = Infinity;
        if (Array.isArray(this.notes)) {
          for (let i = 0; i < this.notes.length; i++) {
            const n = this.notes[i];
            if (n.hit || n.missed || n.holdCompleted || n.holding) continue;
            const diff = currentTime - n.timestamp_ms;
            const absDiff = Math.abs(diff);
            if (absDiff <= 340 && n.type === 'swipe' && (!n.direction || n.direction === dir)) {
              if (absDiff < bestDiff) {
                bestDiff = absDiff;
                targetLane = n.lane;
              }
            }
          }
        }
        if (targetLane === -1) {
          targetLane = (dir === 'left' ? 0 : dir === 'right' ? 2 : 1);
        }
        this.triggerLaneInput(targetLane, 'swipe', dir);
      };

      if (e.key === 'ArrowLeft') {
        handleArrowSwipe('left');
      } else if (e.key === 'ArrowRight') {
        handleArrowSwipe('right');
      } else if (e.key === 'ArrowUp') {
        handleArrowSwipe('up');
      } else if (e.key === 'ArrowDown') {
        handleArrowSwipe('down');
      }
    });

    window.addEventListener('keyup', (e) => {
      if (this.isPaused || this.isRewinding || this.isCountingDown) return;
      const k = (e.key || '').toLowerCase();
      const kb = this.pcKeybinds || { 0: 'd', 1: 'f', 2: 'j' };

      if (k === (kb[0] || 'd') || k === 'a' || k === '1') this.releaseLaneHold(0);
      else if (k === (kb[1] || 'f') || k === 's' || k === ' ' || k === '2') this.releaseLaneHold(1);
      else if (k === (kb[2] || 'j') || k === 'k' || k === '3') this.releaseLaneHold(2);
    });
  }

  /**
   * Calculates optimal scroll duration (ms) based on difficulty stars and note density.
   * Tailored for realistic rhythm gameplay: higher difficulty provides faster scroll & wider note separation.
   */
  /**
   * Calculates optimal scroll duration (ms) based on difficulty stars.
   * Balanced and comfortable rhythm reading speed:
   * 1★: ~1420ms | 3.5★: ~1365ms | 5★: ~1332ms | 7★: ~1288ms | 10★: ~1222ms
   */
  computeDynamicScrollDuration(stars, rawNotes = []) {
    const s = Math.max(1.0, Math.min(10.0, parseFloat(stars) || 3.5));
    const duration = Math.round(1420 - (s - 1.0) * 22);
    return Math.max(900, Math.min(1600, duration));
  }

  computeMaxPossibleScore(notes) {
    if (!notes || notes.length === 0) return 1;
    let simCombo = 0;
    let simScore = 0;
    for (const n of notes) {
      simCombo++;
      let mult = 1;
      if (simCombo >= 100) mult = 5;
      else if (simCombo >= 50) mult = 4;
      else if (simCombo >= 25) mult = 3;
      else if (simCombo >= 10) mult = 2;

      let basePts = 450;
      if (n.type === 'hold') {
        const durationSec = Math.max(0.15, ((n.duration_ms || 600) / 1000));
        basePts = 450 + Math.round(260 * durationSec);
      }
      simScore += basePts * mult;
    }
    return Math.max(1, simScore);
  }

  loadBeatmap(beatmapData, audioBlobOrUrl = null) {
    this.visualDimension = (typeof localStorage !== 'undefined' ? localStorage.getItem('beatstar_visual_dimension') : null) || '3d';
    this.keyStyle = (typeof localStorage !== 'undefined' ? localStorage.getItem('beatstar_key_style') : null) || 'beatstar_large';
    this.isCalibrating = false;
    this.beatmapData = beatmapData;
    this.activeSongPalette = (typeof getSongColorPalette === 'function') ? getSongColorPalette(beatmapData.metadata || beatmapData) : SONG_COLOR_PALETTES.classic;
    if (this.ui && typeof this.ui.onSongLoaded === 'function') {
      this.ui.onSongLoaded(beatmapData.metadata || beatmapData, this.activeSongPalette);
    }
    this.currentAudioSource = audioBlobOrUrl || (beatmapData && beatmapData.audio_blob_url) || null;
    this.numLanes = 3;
    this.laneGlows = [0, 0, 0];
    this.fxRipples = [];
    this.bgBursts = [];
    this.musicalNotes = [];
    this.initCanvasSize();

    if (this.animFrameId) {
      cancelAnimationFrame(this.animFrameId);
      this.animFrameId = null;
    }

    if (this.particles) {
      this.particles.reset();
    }

    // Extract real BPM and Beat Grid Offset
    this.bpm = Number.isFinite(beatmapData.metadata?.bpm) ? beatmapData.metadata.bpm : (Number.isFinite(beatmapData.bpm) ? beatmapData.bpm : 120);
    const beatDurationMs = 60000 / (this.bpm || 120);
    const firstRawTime = (beatmapData.notes && beatmapData.notes.length > 0)
      ? (Number.isFinite(beatmapData.notes[0].timestamp_ms)
          ? beatmapData.notes[0].timestamp_ms
          : (Number.isFinite(beatmapData.notes[0].timeMs)
              ? beatmapData.notes[0].timeMs
              : (Number.isFinite(beatmapData.notes[0].time) ? (beatmapData.notes[0].time > 100 ? beatmapData.notes[0].time : beatmapData.notes[0].time * 1000) : 0)))
      : 0;
    this.firstBeatOffsetMs = Number.isFinite(firstRawTime)
      ? (((firstRawTime % beatDurationMs) + beatDurationMs) % beatDurationMs)
      : 0;

    // Explicitly reset all game state flags
    this.isRunning = false;
    this.isPaused = true;
    this.isCountingDown = true;
    this.isGameOver = false;
    this.isInitialLaunch = true;
    this.isRewinding = false;
    this.isProcessingMiss = false;
    this.lastMissTimePerf = 0;
    this.lastFailSongTimeSec = 0;

    // Extracción robusta y priorizada de estrellas de dificultad
    let diffStars = null;
    const dNameRaw = ((beatmapData.metadata?.difficulty_name || beatmapData.difficulty_name || '') + '');
    const starMatch = dNameRaw.match(/([0-9]+(?:\.[0-9]+)?)\s*★/);
    if (starMatch) {
      diffStars = parseFloat(starMatch[1]);
    }

    if (diffStars === null || !Number.isFinite(diffStars)) {
      if (Number.isFinite(beatmapData.selectedStars)) {
        diffStars = beatmapData.selectedStars;
      } else if (Number.isFinite(beatmapData.metadata?.stars) && beatmapData.metadata.stars !== 3.5) {
        diffStars = beatmapData.metadata.stars;
      } else if (Number.isFinite(beatmapData.stars) && beatmapData.stars !== 3.5) {
        diffStars = beatmapData.stars;
      } else if (Number.isFinite(beatmapData.difficulties?.[0]?.stars)) {
        diffStars = beatmapData.difficulties[0].stars;
      } else if (Number.isFinite(beatmapData.metadata?.stars)) {
        diffStars = beatmapData.metadata.stars;
      } else if (Number.isFinite(beatmapData.stars)) {
        diffStars = beatmapData.stars;
      }
    }

    // Inferencia por palabra clave si aún es nulo o 3.5 por defecto
    if (diffStars === null || diffStars === 3.5) {
      const dName = dNameRaw.toLowerCase();
      if (dName.includes('fácil') || dName.includes('easy') || dName.includes('beginner')) {
        diffStars = 1.5;
      } else if (dName.includes('media') || dName.includes('medium') || dName.includes('normal')) {
        diffStars = 3.5;
      } else if (dName.includes('difícil') || dName.includes('hard')) {
        diffStars = 5.5;
      } else if (dName.includes('extrema') || dName.includes('extreme') || dName.includes('expert')) {
        diffStars = 7.5;
      } else if (dName.includes('insana') || dName.includes('insane') || dName.includes('master')) {
        diffStars = 9.5;
      } else {
        diffStars = diffStars || 3.5;
      }
    }

    // Pass notes through LaneRemapper.sanitizeForTwoFingers to guarantee 2-finger compliance & density limit
    const rawNotes = (beatmapData && Array.isArray(beatmapData.notes)) ? beatmapData.notes.map((n, idx) => {
      let rawT = Number.isFinite(n.timestamp_ms)
        ? n.timestamp_ms
        : (Number.isFinite(n.timeMs)
            ? n.timeMs
            : (Number.isFinite(n.timestamp) ? n.timestamp : (Number.isFinite(n.time) ? (n.time > 100 ? n.time : n.time * 1000) : idx * 500)));
      if (!Number.isFinite(rawT)) rawT = idx * 500;
      rawT = Math.round(rawT);

      let rawDur = Number.isFinite(n.duration_ms)
        ? n.duration_ms
        : (Number.isFinite(n.holdDuration)
            ? (n.holdDuration > 50 ? n.holdDuration : n.holdDuration * 1000)
            : (Number.isFinite(n.duration) ? (n.duration > 50 ? n.duration : n.duration * 1000) : 0));
      if (!Number.isFinite(rawDur) || rawDur < 0) rawDur = 0;
      rawDur = Math.round(rawDur);

      const laneVal = Math.max(0, Math.min(2, parseInt(n.lane ?? n.column ?? n.track ?? 0, 10) || 0));
      const isHold = n.type === 'hold' || n.type === 'long' || rawDur > 0;
      const typeStr = isHold ? 'hold' : ((n.type === 'swipe' || n.type === 'slide') ? 'swipe' : 'tap');

      return {
        ...n,
        id: n.id !== undefined ? n.id : idx,
        lane: laneVal,
        column: laneVal,
        track: laneVal,
        type: typeStr,
        time: rawT / 1000,
        timeMs: rawT,
        timestamp_ms: rawT,
        duration_ms: rawDur,
        holdDuration: rawDur / 1000,
        end_timestamp_ms: isHold ? (rawT + Math.max(150, rawDur)) : null
      };
    }) : [];

    rawNotes.sort((a, b) => a.timestamp_ms - b.timestamp_ms);

    // Bypass difficulty thinning & note-altering algorithms for all community / editor maps
    const isCommunity = !!(
      this.beatmapData.is_community || 
      this.beatmapData.isCommunity ||
      this.beatmapData.source === 'community' ||
      this.beatmapData.source === 'custom' ||
      this.beatmapData.source_name === 'Comunidad' || 
      this.beatmapData.source_name === 'Mi Creación' ||
      (this.beatmapData.metadata && (
        this.beatmapData.metadata.is_community || 
        this.beatmapData.metadata.isCommunity || 
        this.beatmapData.metadata.source === 'community' ||
        this.beatmapData.metadata.source === 'custom' ||
        this.beatmapData.metadata.source_name === 'Comunidad' ||
        this.beatmapData.metadata.source_name === 'Mi Creación'
      )) ||
      window.isPlaytestingFromEditor
    );

    const densityMode = (typeof localStorage !== 'undefined' ? localStorage.getItem('beatstar_map_density') : null) || 'hard';
    const sanitizedNotes = (!isCommunity && typeof LaneRemapper !== 'undefined' && LaneRemapper.sanitizeForTwoFingers)
      ? LaneRemapper.sanitizeForTwoFingers(rawNotes, this.bpm, diffStars, densityMode)
      : rawNotes;

    // Set dynamic base scroll duration based on difficulty curve or explicit custom preset
    const baseScroll = (Number.isFinite(this.beatmapData.baseScrollDurationMs) && this.beatmapData.baseScrollDurationMs > 0)
      ? this.beatmapData.baseScrollDurationMs
      : this.computeDynamicScrollDuration(diffStars, sanitizedNotes);
    this.baseScrollDurationMs = baseScroll;

    // Apply the active note speed multiplier to the dynamic scroll duration
    const speedMult = Math.max(0.5, Math.min(2.5, this.noteSpeedMultiplier || 1.0));
    this.scrollDurationMs = Math.round(baseScroll / speedMult);
    console.log(`[BeatstarEngine] Diff: ${diffStars}★ ("${dNameRaw}") | BaseScroll: ${baseScroll}ms | Mult: ${speedMult}x -> Final: ${this.scrollDurationMs}ms`);

    // Apply custom song playback rate if provided
    const songRate = Math.max(0.5, Math.min(2.0, parseFloat(this.beatmapData.songPlaybackSpeed) || 1.0));
    this.setSongPlaybackSpeed(songRate);

    // Sanitización y de-duplicación estricta cronológica para evitar notas solapadas en el mismo carril
    const sortedCandidateNotes = [...sanitizedNotes].sort((a, b) => {
      const tA = Number.isFinite(a.timestamp_ms) ? a.timestamp_ms : (a.timeMs || (a.time * 1000) || 0);
      const tB = Number.isFinite(b.timestamp_ms) ? b.timestamp_ms : (b.timeMs || (b.time * 1000) || 0);
      return tA - tB;
    });

    const cleanedNotes = [];
    const lastLaneHitTime = [-Infinity, -Infinity, -Infinity];

    for (const n of sortedCandidateNotes) {
      const rawT = Number.isFinite(n.timestamp_ms) ? n.timestamp_ms : (n.timeMs || (n.time * 1000) || 0);
      const adjustedTime = Math.round(rawT);
      const laneVal = Math.max(0, Math.min(2, parseInt(n.lane ?? n.column ?? n.track ?? 0, 10) || 0));

      // Mantener todas las notas del beatmap sin descartar ninguna
      lastLaneHitTime[laneVal] = adjustedTime;

      let rawDur = Number.isFinite(n.duration_ms) ? n.duration_ms : (n.holdDuration ? n.holdDuration * 1000 : 0);
      if (!Number.isFinite(rawDur) || rawDur < 0) rawDur = 0;
      rawDur = Math.round(rawDur);

      // Micro-holds menores a 220ms se convierten en tap directo (en móvil un hold de 100ms es físicamente un tap)
      const isRealHold = (n.type === 'hold' || rawDur > 220) && rawDur > 220;
      const noteType = isRealHold ? 'hold' : (n.type === 'swipe' ? 'swipe' : 'tap');
      const finalDur = isRealHold ? Math.max(220, rawDur) : 0;
      const adjustedEndTime = isRealHold ? (adjustedTime + finalDur) : null;

      cleanedNotes.push({
        ...n,
        id: n.id !== undefined ? n.id : cleanedNotes.length,
        lane: laneVal,
        column: laneVal,
        track: laneVal,
        type: noteType,
        time: adjustedTime / 1000,
        timeMs: adjustedTime,
        timestamp_ms: adjustedTime,
        duration_ms: finalDur,
        holdDuration: finalDur / 1000,
        end_timestamp_ms: adjustedEndTime,
        hit: false,
        holding: false,
        holdCompleted: false,
        missed: false,
        processed: false
      });
    }

    this.notes = cleanedNotes;

    this.activeHolds.clear();
    this.activeTouches.clear();
    this.judgements = [];
    this.score = 0;
    this.displayScore = 0;
    this.combo = 0;
    this.maxCombo = 0;
    this.streakCount = 0;
    this.multiplier = 1;
    this.stars = 0;
    this.lastCelebratedStar = 0;
    this.currentMedalTier = null;
    this.missCount = 0;
    this.invulnerableUntil = 2400; // Invulnerable during startup grace period
    this.stats = { perfectPlus: 0, perfect: 0, great: 0, miss: 0 };
    
    if (this.discoBall) {
      this.discoBall.active = false;
      this.discoBall.descendY = -120;
      this.discoBall.targetY = -120;
      this.discoBall.rotation = 0;
    }

    // Cálculo preciso de la puntuación máxima teórica (100% Perfect+ con multiplicadores)
    this.maxPossibleScore = this.computeMaxPossibleScore(this.notes);
    this.targetScore = this.maxPossibleScore;

    // Load audio track properly depending on type (Blob vs URL/String)
    if (typeof window !== 'undefined' && typeof window.pauseMenuAmbientMusic === 'function') {
      try { window.pauseMenuAmbientMusic(); } catch (_) {}
    }
    if (audioBlobOrUrl instanceof Blob) {
      this.sync.loadAudioBlob(audioBlobOrUrl);
    } else if (typeof audioBlobOrUrl === 'string' && audioBlobOrUrl) {
      this.sync.loadAudioUrl(audioBlobOrUrl);
    } else if (beatmapData.audio_blob_url) {
      this.sync.loadAudioUrl(beatmapData.audio_blob_url);
    } else {
      this.sync.loadAudioUrl('');
    }

    this.sync.seekTo(0);
    this.sync.pause();

    if (this.ui && typeof this.ui.onScoreUpdate === 'function') {
      this.ui.onScoreUpdate(this.score, this.combo, this.stars, this.multiplier, null, 0);
    }
    if (this.ui && typeof this.ui.onSongLoaded === 'function') {
      this.ui.onSongLoaded(beatmapData.metadata, this.activeSongPalette);
    }

    // Configuración del margen de entrada Lead-In: Reloj corre desde -LEAD_IN_TIME hasta 0
    this.isCountingDown = true;
    this.leadInDurationMs = LEAD_IN_TIME;
    this.leadInStartTime = performance.now();
    this.isRunning = true;
    this.isPaused = false;
    this.invulnerableUntil = 2400; // Protección post-arranque

    // El bucle de renderizado arranca inmediatamente para que las notas caigan desde el horizonte durante la cuenta atrás
    this.startLoop();

    if (this.ui && this.ui.onStartCountdown) {
      this.ui.onStartCountdown(this.leadInDurationMs);
    }
  }

  startNativeCalibration() {
    this.visualDimension = (typeof localStorage !== 'undefined' ? localStorage.getItem('beatstar_visual_dimension') : null) || '3d';
    this.keyStyle = (typeof localStorage !== 'undefined' ? localStorage.getItem('beatstar_key_style') : null) || 'beatstar_large';
    this.isCalibrating = true;
    this.calibrationIntervalMs = 1200; // Intervalo de nota cada 1.2s en bucle infinito
    this.scrollDurationMs = 1200;
    this.isPaused = false;
    this.isGameOver = false;
    this.isRewinding = false;
    this.isCountingDown = false;
    this.sync.pause();
    this.notes = [];
    this.activeHolds.clear();
    this.activeTouches.clear();
    this.judgements = [];

    this.synth.ensureContext();
    this.calibrationStartTime = performance.now();
    this.nextCalibNoteTime = performance.now() + 300;
    this.startLoop();
  }

  stopNativeCalibration() {
    this.isCalibrating = false;
    this.notes = [];
    this.activeHolds.clear();
    this.activeTouches.clear();
    this.judgements = [];
    this.stop();
  }

  pause() {
    this.isPaused = true;
    this.isRunning = false;
    this.sync.pause();
    if (this.animFrameId) {
      cancelAnimationFrame(this.animFrameId);
      this.animFrameId = null;
    }
  }

  resume() {
    this.isPaused = false;
    this.isRunning = true;
    this.isRewinding = false;
    this.isProcessingMiss = false;
    this.isCountingDown = false;
    this.lastMissTimePerf = performance.now();
    this.initCanvasSize();
    this.sync.play();
    this.startLoop();
  }

  renderRewindVFX(progress) {
    const ctx = this.ctx;
    const w = this.width;
    const h = this.height;
    if (!w || !h) return;

    ctx.save();
    // 1. Cyan tint vignette
    const alpha = Math.max(0, (1 - progress) * 0.4);
    ctx.fillStyle = `rgba(229, 184, 105, ${alpha * 0.12})`;
    ctx.fillRect(0, 0, w, h);

    // 2. Upward tape scanlines
    ctx.strokeStyle = `rgba(229, 184, 105, ${alpha * 0.35})`;
    ctx.lineWidth = 1.5;
    const numLines = 8;
    const speedOffset = (progress * 1600) % 70;
    for (let i = 0; i < numLines; i++) {
      const lineY = (h * 0.15 + i * 65 - speedOffset + h) % h;
      ctx.beginPath();
      ctx.moveTo(0, lineY);
      ctx.lineTo(w, lineY);
      ctx.stroke();
    }

    // 3. Upward motion indicator
    const chevronAlpha = Math.sin(progress * Math.PI) * 0.75;
    if (chevronAlpha > 0.05) {
      ctx.fillStyle = `rgba(229, 184, 105, ${chevronAlpha})`;
      ctx.font = '900 20px "Cinzel", "Outfit", sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.shadowBlur = 0;
      ctx.fillText('▲ ▲ ▲', w / 2, this.hitLineY - 120 - (progress * 90));
    }
    ctx.restore();
  }

  animateRewind(fromTimeMs, toTimeMs, durationMs = 600, onComplete = null) {
    this.isRewinding = true;
    if (this.animFrameId) {
      cancelAnimationFrame(this.animFrameId);
      this.animFrameId = null;
    }

    const startPerf = performance.now();

    const rewindStep = (now) => {
      const elapsed = now - startPerf;
      const progress = Math.min(1.0, elapsed / durationMs);

      // Smooth cubic-out easing (fast start, silky-smooth deceleration)
      const eased = 1 - Math.pow(1 - progress, 3);

      const currentRenderTime = fromTimeMs + (toTimeMs - fromTimeMs) * eased;

      this.ctx.clearRect(0, 0, this.width, this.height);
      this.renderBackgroundFX(currentRenderTime);
      this.renderLanes(currentRenderTime);
      this.renderRewindVFX(progress);
      this.renderNotes(currentRenderTime);
      this.renderHitLine();

      if (progress < 1.0) {
        this.animFrameId = requestAnimationFrame(rewindStep);
      } else {
        this.isRewinding = false;
        this.animFrameId = null;
        if (onComplete) onComplete();
      }
    };

    this.animFrameId = requestAnimationFrame(rewindStep);
  }

  reviveAndResume() {
    try {
      this.synth.playAnalogTapeRewind();
    } catch (e) {}

    // 1. Exact fail time and rewind position (-2.0s)
    const failTimeSec = this.lastFailSongTimeSec || ((this.sync.getCurrentTimeMs() || 0) / 1000);
    const failTimeMs = failTimeSec * 1000;
    const fromTimeMs = failTimeMs + this.latencyOffsetMs;

    const rewindTargetSec = Math.max(0, failTimeSec - 2.0);
    const rewindTargetMs = rewindTargetSec * 1000;
    const toTimeMs = rewindTargetMs + this.latencyOffsetMs;

    // 2. Seek audio to rewind target
    this.sync.pause();
    this.sync.seekTo(rewindTargetSec);

    // 3. Clear ALL notes prior to and at the failure point!
    // Any note with timestamp <= failTimeMs + 60ms is completely deleted (marked as processed/completed)
    // Only upcoming notes after the failure point will fall down!
    for (const note of this.notes) {
      const noteTime = note.timestamp_ms || 0;
      if (noteTime <= failTimeMs + 60) {
        note.hit = true;
        note.missed = false;
        note.processed = true;
        note.holding = false;
        note.holdCompleted = true;
      } else {
        note.hit = false;
        note.missed = false;
        note.processed = false;
        note.holding = false;
        note.holdCompleted = false;
      }
    }

    if (this.particles) {
      this.particles.reset();
    }
    this.activeHolds.clear();
    this.activeTouches.clear();
    this.judgements = [];
    this.fxRipples = [];
    this.bgBursts = [];

    this.isProcessingMiss = false;
    this.lastMissTimePerf = performance.now();
    // 2.5s invulnerability grace period
    this.invulnerableUntil = failTimeMs + this.latencyOffsetMs + 2500;

    if (this.ui && this.ui.onShowRewindBadge) {
      this.ui.onShowRewindBadge();
    }

    this.isPaused = false;
    this.isGameOver = false;
    this.isCountingDown = false;
    this.initCanvasSize();

    // 4. Start smooth 600ms rewind animation:
    // Notes from failTimeMs onward glide smoothly upwards from hitline to top
    // while all notes prior to failure are completely gone!
    this.animateRewind(fromTimeMs, toTimeMs, 600, () => {
      this.resume();
    });
  }

  restart() {
    if (!this.beatmapData) return;
    this.stop();
    this.loadBeatmap(this.beatmapData, this.currentAudioSource);
  }

  stop() {
    this.isPaused = true;
    this.isRunning = false;
    this.isRewinding = false;
    this.isProcessingMiss = false;
    this.isCountingDown = false;
    if (this.animFrameId) {
      cancelAnimationFrame(this.animFrameId);
      this.animFrameId = null;
    }
    this.sync.pause();
    this.activeHolds.clear();
    this.activeTouches.clear();
    this.notes = [];
    this.judgements = [];
    this.fxRipples = [];
  }

  getCurrentGameTimeMs() {
    if (this.isCountingDown) {
      const elapsed = performance.now() - this.leadInStartTime;
      return Math.min(0, elapsed - this.leadInDurationMs);
    }
    if (this.isCalibrating) {
      return (performance.now() - this.calibrationStartTime) + this.latencyOffsetMs;
    }
    return this.sync.getCurrentTimeMs() + this.latencyOffsetMs;
  }

  getLaneFromX(clientX, clientY = null) {
    const rect = this.canvas.getBoundingClientRect();
    if (!rect || rect.width <= 0) return 1;
    // Normalización de toque por carril (tercios de pantalla limpios y exactos al 100%)
    const normX = (clientX - rect.left) / rect.width;
    const lane = Math.floor(normX * 3);
    return Math.max(0, Math.min(2, lane));
  }

  handleTouchStart(e) {
    e.preventDefault();
    if (this.isPaused || this.isRewinding) return;

    this.lastTouchTime = performance.now();
    const rect = this.canvas.getBoundingClientRect();
    const now = performance.now();

    for (let i = 0; i < e.changedTouches.length; i++) {
      const touch = e.changedTouches[i];
      const x = touch.clientX - rect.left;
      const y = touch.clientY - rect.top;
      const lane = this.getLaneFromX(touch.clientX, touch.clientY);

      this.activeTouches.set(touch.identifier, {
        x0: x, y0: y, t0: now, lane, swiped: false
      });

      // Registro de arrastre interactivo para notas de deslizamiento (Swipe)
      this.activeSwipeDrags.set(touch.identifier, {
        lane, startX: touch.clientX, startY: touch.clientY, dx: 0, dy: 0
      });

      this.triggerLaneInput(lane, 'tap', null, touch.identifier);
    }
  }

  handleTouchMove(e) {
    e.preventDefault();
    if (this.isPaused || this.isRewinding) return;

    const rect = this.canvas.getBoundingClientRect();
    const now = performance.now();

    for (let i = 0; i < e.changedTouches.length; i++) {
      const touch = e.changedTouches[i];
      const touchData = this.activeTouches.get(touch.identifier);
      if (!touchData || touchData.swiped) continue;

      const currentX = touch.clientX - rect.left;
      const currentY = touch.clientY - rect.top;
      const dx = currentX - touchData.x0;
      const dy = currentY - touchData.y0;

      // Actualizar offset de arrastre en tiempo real (mueve la flecha con el dedo)
      const drag = this.activeSwipeDrags.get(touch.identifier);
      if (drag) {
        drag.dx = dx;
        drag.dy = dy;
      }

      const dist = Math.hypot(dx, dy);
      const elapsed = now - touchData.t0;

      if (dist > 22 && elapsed < 400) {
        let direction = 'up';
        if (Math.abs(dx) > Math.abs(dy)) {
          direction = dx > 0 ? 'right' : 'left';
        } else {
          direction = dy > 0 ? 'down' : 'up';
        }

        touchData.swiped = true;
        this.activeSwipeDrags.delete(touch.identifier);
        this.triggerLaneInput(touchData.lane, 'swipe', direction, touch.identifier);
      }
    }
  }

  handleTouchEnd(e) {
    e.preventDefault();
    for (let i = 0; i < e.changedTouches.length; i++) {
      const touch = e.changedTouches[i];
      const touchData = this.activeTouches.get(touch.identifier);
      if (touchData) {
        this.releaseLaneHold(touchData.lane, touch.identifier);
        this.activeTouches.delete(touch.identifier);
      }
      this.activeSwipeDrags.delete(touch.identifier);
    }
  }

  handleMouseDown(e) {
    if (this.isPaused || this.isRewinding) return;
    // Evitar eventos de ratón sintéticos duplicados en dispositivos táctiles
    if (performance.now() - (this.lastTouchTime || 0) < 500) return;
    const lane = this.getLaneFromX(e.clientX, e.clientY);
    const rect = this.canvas.getBoundingClientRect();
    this.mouseTouch = {
      x0: e.clientX - rect.left,
      y0: e.clientY - rect.top,
      t0: performance.now(),
      lane: lane,
      swiped: false
    };
    this.triggerLaneInput(lane, 'tap', null, 'mouse');
  }

  handleMouseMove(e) {
    if (!this.mouseTouch || this.mouseTouch.swiped || this.isPaused || this.isRewinding) return;
    const rect = this.canvas.getBoundingClientRect();
    const dx = (e.clientX - rect.left) - this.mouseTouch.x0;
    const dy = (e.clientY - rect.top) - this.mouseTouch.y0;
    const dist = Math.hypot(dx, dy);

    if (dist > 20) {
      let direction = Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? 'right' : 'left') : (dy > 0 ? 'down' : 'up');
      this.mouseTouch.swiped = true;
      this.triggerLaneInput(this.mouseTouch.lane, 'swipe', direction, 'mouse');
    }
  }

  handleMouseUp() {
    if (this.mouseTouch) {
      this.releaseLaneHold(this.mouseTouch.lane, 'mouse');
      this.mouseTouch = null;
    }
  }

  triggerLaneInput(lane, inputType = 'tap', swipeDirection = null, touchId = null) {
    this.laneGlows[lane] = 1.0;
    if (this.lanePressAnim) this.lanePressAnim[lane] = performance.now();
    const currentTime = this.getCurrentGameTimeMs();

    const hitX = (lane + 0.5) * this.laneWidth;
    const hitY = this.hitLineY;

    // Palette per lane
    const burstPalette = [
      { c1: '#00f2fe', c2: '#3b82f6', alt: '#39ff14' }, // Lane 0: Electric Cyan / Lime
      { c1: '#ff007f', c2: '#a855f7', alt: '#ffe600' }, // Lane 1: Hot Magenta / Royal Purple
      { c1: '#fbbf24', c2: '#ff3300', alt: '#ff007f' }  // Lane 2: Radiant Gold / Crimson
    ];
    const p = burstPalette[lane % 3] || { c1: '#00f2fe', c2: '#ff007f', alt: '#ffe600' };

    const effect = this.activeEffect || 'default_neon';

    // Spawn rich, creative full-screen phenomena strictly on key tap (capped to avoid GC/frame drops)
    if (this.bgBursts.length >= 4) this.bgBursts.shift();
    if (this.fxRipples.length >= 5) this.fxRipples.shift();

    if (effect === 'paint_splash') {
      const blotches = [];
      const blotchColors = ['#ff007f', '#00f2fe', '#ffe600', '#39ff14', '#b142ff', '#ff3366'];
      const numBlotches = 4;
      for (let i = 0; i < numBlotches; i++) {
        const ang = (Math.random() - 0.5) * Math.PI * 1.7 - Math.PI / 2;
        const dist = 50 + Math.random() * (this.height * 0.55);
        blotches.push({
          angle: ang,
          dist: dist,
          maxDist: dist * (1.1 + Math.random() * 0.2),
          radius: 10 + Math.random() * 18,
          color: blotchColors[i % blotchColors.length],
          subDrops: [
            { dx: (Math.random() - 0.5) * 25, dy: (Math.random() - 0.5) * 25, r: 2 + Math.random() * 4 }
          ]
        });
      }

      this.bgBursts.push({
        type: 'paint_splash',
        lane,
        x: hitX,
        y: hitY,
        radius: 30,
        maxRadius: Math.max(this.width, this.height) * 0.9,
        alpha: 0.85,
        decay: 2.5,
        color1: p.c1,
        color2: p.c2,
        blotches: blotches
      });
    } else if (effect === 'fire_inferno') {
      const flames = [];
      const numFlames = 3;
      for (let i = 0; i < numFlames; i++) {
        flames.push({
          targetX: (this.width * 0.15) + Math.random() * (this.width * 0.7),
          curveOffsetX: (Math.random() - 0.5) * 90,
          speed: 1.2 + Math.random() * 0.7,
          phase: Math.random() * Math.PI * 2,
          width: 18 + Math.random() * 20,
          color: i % 2 === 0 ? '#ffea00' : '#ff3300'
        });
      }

      this.bgBursts.push({
        type: 'fire_inferno',
        lane,
        x: hitX,
        y: hitY,
        progress: 0,
        radius: 20,
        maxRadius: Math.max(this.width, this.height) * 0.9,
        alpha: 0.9,
        decay: 2.3,
        color1: '#ff8800',
        color2: '#ff2200',
        flames: flames
      });
    } else if (effect === 'color_burst') {
      const rays = [];
      const numRays = 6;
      for (let i = 0; i < numRays; i++) {
        rays.push({
          angle: (i / numRays) * Math.PI * 2 + (Math.random() - 0.5) * 0.2,
          len: 80 + Math.random() * (this.height * 0.5),
          width: 6 + Math.random() * 10,
          color: i % 2 === 0 ? p.c1 : p.c2
        });
      }

      this.bgBursts.push({
        type: 'color_burst',
        lane,
        x: hitX,
        y: hitY,
        rotation: Math.random() * Math.PI * 2,
        rotSpeed: (Math.random() - 0.5) * 2.0,
        radius: 20,
        maxRadius: Math.max(this.width, this.height) * 0.95,
        alpha: 0.85,
        decay: 2.2,
        color1: p.c1,
        color2: p.c2,
        rays: rays
      });
    }

    this.fxRipples.push({
      lane,
      x: hitX,
      y: hitY,
      radius: 12,
      maxRadius: 180,
      alpha: 0.85,
      decay: 2.2,
      color: p.c1
    });

    // Ventana de colisión fluida (±340 ms): cubre Perfect+, Perfect, Great y Good sin ignorar toques
    const HIT_WINDOW = 340;
    let closestNote = null;
    let minDiff = Infinity;

    // 1. Recolectar todas las notas activas en este carril dentro de la ventana de tiempo
    const laneNotes = [];
    for (let i = 0; i < this.notes.length; i++) {
      const note = this.notes[i];
      if (note.hit || note.missed || note.holdCompleted || note.holding) continue;
      if (!this.isCalibrating && note.lane !== lane) continue;

      const diffFromNote = currentTime - note.timestamp_ms;
      const absDiff = Math.abs(diffFromNote);
      if (absDiff <= HIT_WINDOW) {
        laneNotes.push({ note, absDiff, diff: diffFromNote, time: note.timestamp_ms });
      }
    }

    // Ordenar cronológicamente (la nota que llega primero en el tiempo va primero)
    laneNotes.sort((a, b) => a.time - b.time);

    if (laneNotes.length === 0) {
      if (this.customBgMode === 'reactive') {
        this.addReactiveBurst(lane, hitX, hitY, this.getScoreColor('perfectPlus'));
      }
      if (this.isCalibrating) {
        this.synth.playClick();
        this.emitKeyHit(hitX, hitY, this.getScoreColor('perfectPlus'), 24);
        return;
      }
      // Pulsar en vacío no penaliza
      this.synth.playClick();
      return;
    }

    // La nota frontal es la que está más abajo en la pista (más cercana a la línea de golpeo)
    const frontEntry = laneNotes[0];
    const frontNote = frontEntry.note;

    if (inputType === 'tap') {
      // REGLA FUNDAMENTAL: Si la nota frontal es un SWIPE, un toque normal es absorbido por el gesto
      // y NUNCA puede saltarse el swipe para consumir la nota tap que viene arriba.
      if (frontNote.type === 'swipe') {
        return; // El swipe requiere gesto de deslizamiento
      }
      // La nota frontal es un tap normal o un hold
      closestNote = frontNote;
      minDiff = frontEntry.absDiff;
    } else if (inputType === 'swipe') {
      // REGLA FUNDAMENTAL: Los swipes SOLO pueden consumir notas de tipo SWIPE.
      // Jamás pueden activar ni hacer desaparecer notas normales de tap.
      if (frontNote.type === 'swipe') {
        const targetDir = frontNote.direction || 'up';
        if (!swipeDirection || !targetDir || swipeDirection === targetDir) {
          closestNote = frontNote;
          minDiff = frontEntry.absDiff;
        } else {
          // Dirección de swipe incorrecta: no valida
          return;
        }
      } else {
        // La nota frontal no es un swipe; el gesto de deslizamiento se ignora para notas normales
        return;
      }
    }

    if (!closestNote) {
      return;
    }

    if (this.isCalibrating) {
      closestNote.hit = true;
      const jCalib = this.judgeHit(closestNote, minDiff, hitX, hitY);
      this.emitKeyHit(hitX, hitY, jCalib.color, 24);
      if (this.customBgMode === 'reactive') {
        this.addReactiveBurst(lane, hitX, hitY, jCalib.color);
      }
      return;
    }

    // Nota tap o notas estándar (cualquier toque o tecla sobre la nota la valida inmediatamente)
    if (closestNote.type === 'tap' || (!closestNote.type || closestNote.type === 'single' || closestNote.type === 'normal')) {
      closestNote.hit = true;
      let j;
      try {
        j = this.judgeHit(closestNote, minDiff, hitX, hitY);
      } catch (eTap) {
        console.error('[Engine] Error en judgeHit tap:', eTap);
        j = { text: 'PERFECT', color: '#ffd700', points: 80 };
      }
      this.emitKeyHit(hitX, hitY, j.color, 22);
      if (this.customBgMode === 'reactive') {
        this.addReactiveBurst(lane, hitX, hitY, j.color);
      }
    } 
    else if (closestNote.type === 'swipe') {
      const targetDir = closestNote.direction || 'up';
      const isExactSwipe = (inputType === 'swipe' && (swipeDirection === targetDir || !closestNote.direction));
      
      if (!isExactSwipe) {
        // Dirección errónea o toque simple: no valida
        return;
      }

      closestNote.hit = true;
      let j;
      try {
        j = this.judgeHit(closestNote, minDiff, hitX, hitY, 'SWIPE');
      } catch (eSwipe) {
        console.error('[Engine] Error en judgeHit swipe:', eSwipe);
        j = { text: 'SWIPE', color: '#ffd700', points: 100 };
      }
      this.emitKeyHit(hitX, hitY, j.color, 26);

      // ANIMACIÓN DE EXPULSIÓN HIPERSÓNICA: La tecla sale disparada hacia esa dirección
      if (!this.activeSwipeLaunches) this.activeSwipeLaunches = [];
      const launchVx = targetDir === 'left' ? -1550 : (targetDir === 'right' ? 1550 : 0);
      const launchVy = targetDir === 'up' ? -1650 : (targetDir === 'down' ? 1450 : 0);
      const launchRot = targetDir === 'left' ? -0.45 : (targetDir === 'right' ? 0.45 : (targetDir === 'down' ? 0.2 : -0.2));

      this.activeSwipeLaunches.push({
        lane: closestNote.lane,
        x: hitX,
        y: hitY,
        dir: targetDir,
        color: j.color || '#00f2fe',
        startTime: performance.now(),
        duration: 420,
        vx: launchVx,
        vy: launchVy,
        rot: launchRot
      });

      if (this.particles && typeof this.particles.emitSwipeBurst === 'function') {
        this.particles.emitSwipeBurst(hitX, hitY, targetDir, j.color, 36);
      }
      if (this.customBgMode === 'reactive') {
        this.addReactiveBurst(lane, hitX, hitY, j.color);
      }
    } 
    else if (closestNote.type === 'hold') {
      const rawDur = closestNote.duration_ms || 0;
      if (rawDur <= 220) {
        // Micro-hold se completa inmediatamente como tap seguro
        closestNote.hit = true;
        closestNote.holdCompleted = true;
        let j;
        try {
          j = this.judgeHit(closestNote, minDiff, hitX, hitY);
        } catch (eHold) {
          j = { text: 'PERFECT', color: '#ffd700', points: 80 };
        }
        this.emitKeyHit(hitX, hitY, j.color, 22);
        if (this.customBgMode === 'reactive') {
          this.addReactiveBurst(lane, hitX, hitY, j.color);
        }
      } else {
        closestNote.holding = true;
        closestNote.missed = false;
        let j;
        try {
          j = this.judgeHit(closestNote, minDiff, hitX, hitY);
        } catch (eHold2) {
          j = { text: 'PERFECT', color: '#ffd700', points: 80 };
        }
        this.activeHolds.set(lane, {
          note: closestNote,
          touchId: touchId,
          startTime: currentTime,
          initialTime: closestNote.timestamp_ms,
          color: j.color
        });
        this.emitKeyHit(hitX, hitY, j.color, 20);
        if (this.customBgMode === 'reactive') {
          this.addReactiveBurst(lane, hitX, hitY, j.color);
        }
      }
    } else {
      closestNote.hit = true;
      let j;
      try {
        j = this.judgeHit(closestNote, minDiff, hitX, hitY);
      } catch (eDef) {
        j = { text: 'GOOD', color: '#9e7b66', points: 25 };
      }
      this.emitKeyHit(hitX, hitY, j.color, 20);
    }
  }

  releaseLaneHold(lane, touchId = null) {
    const active = this.activeHolds.get(lane);
    if (!active) return;
    if (touchId !== null && active.touchId !== null && active.touchId !== touchId) return;

    const currentTime = this.getCurrentGameTimeMs();
    const note = active.note;
    const endT = note.end_timestamp_ms || (note.timestamp_ms + (note.duration_ms || 700));
    const heldDuration = currentTime - active.startTime;
    const totalDuration = endT - active.startTime;

    // Acierto completado si se mantuvo al menos el 60% o hasta 180ms del final
    if (currentTime >= endT - 180 || (totalDuration > 0 && (heldDuration / totalDuration) >= 0.60)) {
      note.holdCompleted = true;
      note.hit = true;
      note.holding = false;
      this.addScore(450 * this.multiplier);
      if (this.ui && this.ui.onHitBeatPulse) {
        this.ui.onHitBeatPulse(this.combo);
      }
      const hitX = (lane + 0.5) * this.laneWidth;
      const holdColor = (active.color && active.color !== '#00ff88' && active.color !== '#00f2fe') ? active.color : '#e5b869';
      this.emitKeyHit(hitX, this.hitLineY, holdColor, 30);
    } else {
      note.missed = true;
      note.holding = false;
      const nowPerf = performance.now();
      if (!this.isProcessingMiss && (nowPerf - this.lastMissTimePerf >= 750)) {
        this.synth.playPunchyArcadeMiss();
        this.addJudgement('HOLD DROP', '#a81b26');
        this.handleMiss();
      }
    }
    this.activeHolds.delete(lane);
  }

  judgeHit(note, diffMs, x, y, customLabel = null) {
    let text = 'GREAT';
    let color = this.getScoreColor('great');
    let points = 150;
    let flashDuration = 0.18;
    let flashColor = '#ffd700';

    if (diffMs <= 45) {
      text = customLabel ? `PERFECT+ ${customLabel}` : 'PERFECT+';
      color = this.getScoreColor('perfectPlus');
      flashColor = '#00ffc8'; // Verde Esmeralda / Cian Eléctrico Ultra Brillante
      flashDuration = 0.22;
      points = 450;
      this.stats.perfectPlus++;
      this.streakCount++;
    } else if (diffMs <= 90) {
      text = customLabel ? `PERFECT ${customLabel}` : 'PERFECT';
      color = this.getScoreColor('perfect');
      flashColor = '#00f2fe'; // Cian Neón
      flashDuration = 0.20;
      points = 300;
      this.stats.perfect++;
      this.streakCount++;
    } else if (diffMs <= 170) {
      text = customLabel ? `GREAT ${customLabel}` : 'GREAT';
      color = this.getScoreColor('great');
      flashColor = '#ffd700'; // Oro Brillante
      flashDuration = 0.17;
      points = 150;
      this.stats.great++;
      this.streakCount = Math.max(0, this.streakCount - 1);
    } else {
      text = customLabel ? `GOOD ${customLabel}` : 'GOOD';
      color = this.getScoreColor('good');
      flashColor = '#ff8800'; // Ámbar / Bronce
      flashDuration = 0.15;
      points = 75;
      this.stats.good = (this.stats.good || 0) + 1;
      this.streakCount = 0;
    }

    const noteLane = (note && typeof note.lane === 'number') ? note.lane : 1;

    // Columna de Luz de Carril (Lane Flash): Explosión de luz volumétrica del color del juicio
    this.laneFlashTimers[noteLane] = flashDuration;
    this.laneFlashColors[noteLane] = flashColor;
    this.laneGlows[noteLane] = 1.0;

    // Micro-screen shake: simultaneous hits (within 35ms) or swipe note PERFECT+ (-3px a +3px en 60ms)
    const nowPerf = performance.now();
    if ((customLabel === 'SWIPE' && diffMs <= 45) || (nowPerf - this.lastHitTimePerf < 35)) {
      this.triggerScreenShake(3.5, 70);
    }
    this.lastHitTimePerf = nowPerf;

    const prevMult = this.multiplier || 1;
    this.combo++;
    if (this.combo > this.maxCombo) this.maxCombo = this.combo;

    // Beat Pulse dinámico en cada acierto
    if (this.ui && this.ui.onHitBeatPulse) {
      this.ui.onHitBeatPulse(this.combo);
    }

    // Umbrales de Multiplicador:
    // x2 -> Combo 10 | x3 -> Combo 25 | x4 -> Combo 50 | x5 -> Combo 100
    if (this.combo >= 100) {
      this.multiplier = 5;
    } else if (this.combo >= 50) {
      this.multiplier = 4;
    } else if (this.combo >= 25) {
      this.multiplier = 3;
    } else if (this.combo >= 10) {
      this.multiplier = 2;
    } else {
      this.multiplier = 1;
    }

    if (this.multiplier > prevMult) {
      const midX = this.width / 2;
      const hitY = Number.isFinite(this.hitLineY) ? this.hitLineY : (this.height * 0.84);
      this.addRipple(midX, hitY, '#ffd700', 320);

      // Explosión 3D cinemática luminosa sin oscurecer jamás la pantalla
      if (this.multiplier === 2) {
        this.triggerComboExplosion('2X MULTI', '¡BOOST ÁMBAR!', '#ffd700', '#ffd700', 1.2);
      } else if (this.multiplier === 3) {
        this.triggerComboExplosion('3X FIEBRE', '¡MAGENTA NEÓN!', '#ff007f', '#ff007f', 1.4);
      } else if (this.multiplier === 4) {
        this.triggerComboExplosion('4X HIPER', '¡CIAN ELÉCTRICO!', '#00f2fe', '#00f2fe', 1.6);
      } else if (this.multiplier >= 5) {
        this.triggerComboExplosion('5X DIAMANTE', '¡APOTEOSIS TOTAL!', '#ffffff', '#ffffff', 2.0);
      }
    } else {
      this.checkComboMilestone(this.combo);
    }

    if (diffMs <= 90) {
      this.spawnMusicalNotes(x, y, color, diffMs <= 45 ? 2 : 1);
    }
    
    this.addScore(points * this.multiplier);
    this.addJudgement(text, color, noteLane);
    return { text, color, points };
  }

  // Nueva Explosión 3D Cinemática y Transformación de Color de Fondo
  triggerComboExplosion(title, subtext = '', color = '#ffd700', targetAtmosphereColor = '#ffd700', intensity = 1.0) {
    const w = this.width || 360;
    const h = this.height || 640;
    const midX = w / 2;
    const midY = h * 0.42;

    // Actualizar paleta activa de la atmósfera con resplandor aditivo luminoso
    this.targetAtmosphereColor = color || targetAtmosphereColor;
    this.atmosphereShiftProgress = 0.0;

    // Crear partículas en perspectiva 3D
    const sparks = [];
    const sparkCount = Math.round(38 * Math.min(2.0, intensity));
    const pal = [color, '#ffffff', '#fff5cc', '#ffe082', '#00f2fe', '#ff007f'];

    for (let i = 0; i < sparkCount; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = (90 + Math.random() * 260) * intensity;
      const zSpeed = (-150 + Math.random() * 380) * intensity;
      sparks.push({
        x: midX + (Math.random() - 0.5) * 40,
        y: midY + (Math.random() - 0.5) * 30,
        z: 0,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        vz: zSpeed,
        radius: (2.0 + Math.random() * 3.5) * intensity,
        color: pal[Math.floor(Math.random() * pal.length)],
        alpha: 1.0,
        decay: 1.8 + Math.random() * 1.4,
        rot: Math.random() * Math.PI * 2,
        rotSpeed: (Math.random() - 0.5) * 10
      });
    }

    // Rayos de luz volumétricos rotatorios
    const rays = [];
    const rayCount = 14;
    for (let i = 0; i < rayCount; i++) {
      const baseAngle = (i / rayCount) * Math.PI * 2 + (Math.random() - 0.5) * 0.2;
      rays.push({
        angle: baseAngle,
        length: Math.hypot(w, h) * (0.8 + Math.random() * 0.5),
        width: 18 + Math.random() * 28,
        color: i % 2 === 0 ? color : '#ffffff'
      });
    }

    const explosion = {
      title,
      subtext,
      color: color || '#ffd700',
      targetAtmosphereColor: color || targetAtmosphereColor,
      originX: midX,
      originY: midY,
      radius: 0,
      maxRadius: Math.hypot(w, h) * 1.35,
      age: 0,
      duration: 1.8,
      alpha: 1.0,
      scale: 1.7,
      intensity: intensity || 1.0,
      sparks,
      rays,
      rotation: 0
    };

    if (this.combo3DExplosions.length >= 2) this.combo3DExplosions.shift();
    this.combo3DExplosions.push(explosion);

    this.topComboToast = explosion; // Retrocompatibilidad para HUD listeners
    this.triggerScreenShake(3.8 * intensity, 90);

    if (this.ui && typeof this.ui.onComboMilestone === 'function') {
      this.ui.onComboMilestone(title, subtext, color);
    }
  }

  showTopMilestone(title, subtext = '', color = '#ffd700', duration = 1.2) {
    this.triggerComboExplosion(title, subtext, color, color, 1.0);
  }

  checkComboMilestone(c) {
    const milestones = [10, 25, 50, 75, 100, 150, 200, 250, 300, 400, 500, 750, 1000];
    if (milestones.includes(c)) {
      const hitY = Number.isFinite(this.hitLineY) ? this.hitLineY : (this.height * 0.84);
      this.addRipple(this.width / 2, hitY, '#ffd700', 260);

      let sub = '¡COMBO RACHA!';
      let col = '#ffd700';
      let intens = 1.0;

      if (c >= 300) {
        sub = '¡LEGENDARIO!';
        col = '#ffffff';
        intens = 1.8;
      } else if (c >= 200) {
        sub = '¡SUPERNOVA!';
        col = '#00f2fe';
        intens = 1.6;
      } else if (c >= 100) {
        sub = '¡FIEBRE TOTAL!';
        col = '#ff007f';
        intens = 1.4;
      } else if (c >= 50) {
        sub = '¡EN LLAMAS!';
        col = '#ffaa00';
        intens = 1.2;
      }

      this.triggerComboExplosion(`${c} COMBO`, sub, col, col, intens);
    }
  }

  addRipple(x, y, color = '#ffd700', maxRadius = 240) {
    const w = this.width || 360;
    const lane = Math.max(0, Math.min(2, Math.floor((x / Math.max(1, w)) * 3)));
    if (this.fxRipples.length >= 6) this.fxRipples.shift();
    this.fxRipples.push({
      lane,
      x: x,
      y: y,
      radius: 14,
      maxRadius: maxRadius,
      alpha: 0.90,
      decay: 2.2,
      color: color || '#ffd700'
    });
  }

  triggerGameOver() {
    this.triggerGameEnd();
  }

  spawnMusicalNotes(x, y, color = '#ffd700', count = 2) {
    if (this.musicalNotes.length > 8) {
      this.musicalNotes.splice(0, this.musicalNotes.length - 8);
    }
    const symbols = ['𝄞', '𝅘𝅥𝅯', '♬', '♩', '𝅘𝅥𝅮', '♪'];
    const safeCount = Math.min(count, 2);
    for (let i = 0; i < safeCount; i++) {
      const sym = symbols[Math.floor(Math.random() * symbols.length)];
      const angle = -Math.PI / 2 + (Math.random() - 0.5) * 1.3;
      const speed = 75 + Math.random() * 95;
      this.musicalNotes.push({
        symbol: sym,
        x: x + (Math.random() - 0.5) * 36,
        y: y - 12 + (Math.random() - 0.5) * 16,
        vx: Math.cos(angle) * speed * 0.45,
        vy: Math.sin(angle) * speed,
        alpha: 1.0,
        decay: 1.1 + Math.random() * 0.8,
        color: color,
        scale: 0.9 + Math.random() * 0.45,
        rotation: (Math.random() - 0.5) * 0.35,
        rotSpeed: (Math.random() - 0.5) * 1.2
      });
    }
  }

  addScore(pts) {
    this.score += pts;
    const maxScore = Math.max(1, this.maxPossibleScore || 1);
    const scorePct = Math.min(100.0, (this.score / maxScore) * 100);

    const totalNotes = (this.notes && this.notes.length) || 0;

    // Asignación progresiva de estrellas (0 a 5) según la puntuación acumulada sobre maxPossibleScore:
    // 1★: >= 20% | 2★: >= 40% | 3★: >= 60% | 4★: >= 75% | 5★: >= 90%
    let stars = 0;
    if (scorePct >= 90.0) stars = 5;
    else if (scorePct >= 75.0) stars = 4;
    else if (scorePct >= 60.0) stars = 3;
    else if (scorePct >= 40.0) stars = 2;
    else if (scorePct >= 20.0) stars = 1;
    // Las estrellas nunca disminuyen durante la partida
    const prevStars = this.lastCelebratedStar || 0;
    this.stars = Math.max(this.stars, stars);

    // Celebración de Estrella Desbloqueada:
    // 1. Shockwave circular en nodo de la estrella
    // 2. 8 chispas en caída parabólica aditiva
    // 3. Camera micro-shake de 2px durante 40ms
    if (this.stars > prevStars) {
      for (let s = prevStars + 1; s <= this.stars; s++) {
        if (this.ui && this.ui.onStarUnlocked) {
          this.ui.onStarUnlocked(s, s === 5);
        }
        if (this.particles && this.particles.emitStarCelebration) {
          const cutPct = (s === 1 ? 0.20 : s === 2 ? 0.40 : s === 3 ? 0.60 : s === 4 ? 0.75 : 0.90);
          const starX = (this.width / 2) - 80 + (cutPct * 160);
          const starY = 32;
          this.particles.emitStarCelebration(starX, starY, s === 5);
        }
        this.triggerScreenShake(2.0, 40);
      }
      this.lastCelebratedStar = this.stars;
    }

    // Medallas en tiempo real: Requiere un mínimo de 100 notas en la pista
    // Plata: >= 92% | Oro: >= 94% | Platino: >= 96%
    let medalTier = null;
    if (totalNotes >= 100) {
      if (scorePct >= 96.0) medalTier = 'platinum';
      else if (scorePct >= 94.0) medalTier = 'gold';
      else if (scorePct >= 92.0) medalTier = 'silver';
    }
    // La medalla alcanzada nunca disminuye durante la partida
    if (this.currentMedalTier === 'platinum') medalTier = 'platinum';
    else if (this.currentMedalTier === 'gold' && medalTier !== 'platinum') medalTier = 'gold';
    else if (this.currentMedalTier === 'silver' && !medalTier) medalTier = 'silver';
    this.currentMedalTier = medalTier;

    const totalJudged = (this.stats.perfectPlus || 0) + (this.stats.perfect || 0) + (this.stats.great || 0) + (this.stats.good || 0) + (this.stats.miss || 0);
    const accuracyPct = totalJudged > 0
      ? Math.min(100.0, Math.max(0.0, (((this.stats.perfectPlus * 100) + (this.stats.perfect * 80) + (this.stats.great * 50) + ((this.stats.good || 0) * 25)) / (totalJudged * 100)) * 100))
      : 100.0;

    this.ui.onScoreUpdate(this.score, this.combo, this.stars, this.multiplier, this.currentMedalTier, scorePct, accuracyPct);
  }

  handleMiss() {
    const nowPerf = performance.now();
    if (this.isProcessingMiss || (nowPerf - this.lastMissTimePerf < 750)) {
      return;
    }

    this.isProcessingMiss = true;
    this.lastMissTimePerf = nowPerf;
    this.lastFailSongTimeSec = (this.sync.getCurrentTimeMs() || 0) / 1000;

    this.combo = 0;
    this.streakCount = 0;
    this.multiplier = 1;
    this.stats.miss++;
    
    const maxScore = Math.max(1, this.maxPossibleScore || 1);
    const scorePct = Math.min(100.0, (this.score / maxScore) * 100);

    const totalJudged = (this.stats.perfectPlus || 0) + (this.stats.perfect || 0) + (this.stats.great || 0) + (this.stats.good || 0) + (this.stats.miss || 0);
    const accuracyPct = totalJudged > 0
      ? Math.min(100.0, Math.max(0.0, (((this.stats.perfectPlus * 100) + (this.stats.perfect * 80) + (this.stats.great * 50) + ((this.stats.good || 0) * 25)) / (totalJudged * 100)) * 100))
      : 100.0;

    // Haptic & visual feedback on miss
    this.triggerScreenShake(3.5, 70);
    this.vignetteAlpha = 0.45;
    this.vignetteColor = '#ff2040';

    // Al fallar, las estrellas y medallas alcanzadas no disminuyen
    if (this.ui && typeof this.ui.onScoreUpdate === 'function') {
      this.ui.onScoreUpdate(this.score, this.combo, this.stars, this.multiplier, this.currentMedalTier, scorePct, accuracyPct);
    }

    if (!this.isCalibrating && this.beatmapData) {
      const penaltyCost = Math.pow(2, this.missCount);
      this.missCount++;
      this.pause();
      if (this.ui && typeof this.ui.onMissPenalty === 'function') {
        this.ui.onMissPenalty(penaltyCost, this.missCount, this.score);
      }
    } else {
      setTimeout(() => {
        this.isProcessingMiss = false;
      }, 750);
    }
  }

  /**
   * Juicio Pop-Up Dinámico sobre el carril impactado:
   * Nace con escala 1.45, se comprime a 1.0 en 90ms (compresión elástica visual),
   * y flota 15px hacia arriba mientras decae suavemente.
   */
  addJudgement(text, color, lane = null) {
    const hitY = Number.isFinite(this.hitLineY) ? this.hitLineY : (this.height * 0.84);
    const startY = hitY - 24;
    let posX = this.width / 2;
    if (lane !== null && lane >= 0 && lane <= 2) {
      if (this.visualDimension !== '2d') {
        const xL = this.getLaneBoundaryX(lane, startY);
        const xR = this.getLaneBoundaryX(lane + 1, startY);
        posX = (xL + xR) / 2;
      } else {
        posX = (lane + 0.5) * (this.width / 3);
      }
    }
    this.judgements.push({
      text: text,
      color: color || '#fff5db',
      x: posX,
      y: startY,
      baseY: startY,
      alpha: 1.0,
      scale: 1.45,
      age: 0
    });
  }

  update(dt) {
    if (this.isPaused || this.isRewinding) return;

    if (this.sync && this.sync.audioElement && this.sync.isPlaying) {
      if (Math.abs(this.sync.audioElement.playbackRate - this.songPlaybackRate) > 0.01) {
        try {
          this.sync.audioElement.playbackRate = this.songPlaybackRate;
          this.sync.audioElement.defaultPlaybackRate = this.songPlaybackRate;
        } catch (e) {}
      }
    }

    if (this.isCalibrating) {
      const now = performance.now();
      const currentCalibTime = (now - this.calibrationStartTime) + this.latencyOffsetMs;
      const interval = this.calibrationIntervalMs || 1200;

      if (now >= this.nextCalibNoteTime) {
        const targetHitTime = currentCalibTime + this.scrollDurationMs;
        const audioCtx = this.synth.ensureContext();
        const delaySec = Math.max(0, (this.scrollDurationMs - this.latencyOffsetMs) / 1000);
        if (audioCtx) this.synth.playPianoChime(audioCtx.currentTime + delaySec);

        this.notes.push({
          id: Date.now() + Math.random(),
          lane: 1,
          type: 'tap',
          timestamp_ms: targetHitTime,
          hit: false,
          missed: false,
          flashed: false
        });

        this.nextCalibNoteTime = now + interval;
      }

      for (const note of this.notes) {
        if (!note.flashed && currentCalibTime >= note.timestamp_ms) {
          note.flashed = true;
          const hitX = (1 + 0.5) * this.laneWidth;
          // Only pulse lane glow — full effect fires on player tap to avoid double animation
          this.laneGlows[1] = 1.0;

          if (this.ui && this.ui.onMetronomeBeat) {
            this.ui.onMetronomeBeat();
          }
        }
      }

      if (this.notes.length > 25) {
        this.notes = this.notes.filter(n => (currentCalibTime - n.timestamp_ms) < 1500);
      }

      this.updateVisualEffects(dt);
      return;
    }

    if (this.isCountingDown) {
      const elapsed = performance.now() - this.leadInStartTime;
      if (elapsed >= this.leadInDurationMs) {
        this.isCountingDown = false;
        if (typeof window !== 'undefined' && typeof window.pauseMenuAmbientMusic === 'function') {
          try { window.pauseMenuAmbientMusic(); } catch (_) {}
        }
        const startSec = (Number.isFinite(this.beatmapData.startMarkerMs) && this.beatmapData.startMarkerMs > 0)
          ? (this.beatmapData.startMarkerMs / 1000)
          : 0;
        this.sync.seekTo(startSec);
        this.sync.play();
      }
    }

    const currentTime = this.getCurrentGameTimeMs();
    const nowPerf = performance.now();
    const canTriggerMiss = !this.isProcessingMiss && (nowPerf - this.lastMissTimePerf >= 750);

    // Emisor de Chispas en Holds (Soldadura): 3 partículas continuas por frame en la base del piano
    if (this.activeHolds && this.activeHolds.size > 0) {
      const hitY = Number.isFinite(this.hitLineY) ? this.hitLineY : (this.height * 0.84);
      for (const [lane, holdData] of this.activeHolds.entries()) {
        let holdX = 0;
        if (this.visualDimension !== '2d') {
          holdX = (this.getLaneBoundaryX(lane, hitY) + this.getLaneBoundaryX(lane + 1, hitY)) / 2;
        } else {
          holdX = (lane + 0.5) * (this.width / 3);
        }
        if (this.particles) {
          this.particles.emitHoldSparks(holdX, hitY, holdData.color || '#ffe082', 3);
        }
        this.laneFlashTimers[lane] = 0.11;
      }
    }

    // Once a note has passed the hit window (+240ms), it can no longer be hit and is judged MISS
    const exitScreenOffsetMs = 240;

    for (const note of this.notes) {
      if (!note.hit && !note.missed && !note.holding && !note.processed && !note.holdCompleted) {
        if (currentTime >= 0 && (currentTime - note.timestamp_ms >= exitScreenOffsetMs)) {
          note.missed = true;
          note.processed = true;

          if (currentTime > this.invulnerableUntil && canTriggerMiss) {
            this.synth.playPunchyArcadeMiss();
            this.addJudgement('MISS', '#ff4d4d');
            this.handleMiss();
            break;
          } else {
            // Still reset combo and record stats if in continue mode or cooldown
            this.combo = 0;
            this.multiplier = 1;
            this.streakCount = 0;
            this.stats.miss++;

            const maxScore = Math.max(1, this.maxPossibleScore || 1);
            const scorePct = Math.min(100.0, (this.score / maxScore) * 100);

            const totalJudged = (this.stats.perfectPlus || 0) + (this.stats.perfect || 0) + (this.stats.great || 0) + (this.stats.good || 0) + (this.stats.miss || 0);
            const accuracyPct = totalJudged > 0
              ? Math.min(100.0, Math.max(0.0, (((this.stats.perfectPlus * 100) + (this.stats.perfect * 80) + (this.stats.great * 50) + ((this.stats.good || 0) * 25)) / (totalJudged * 100)) * 100))
              : 100.0;

            if (this.ui && this.ui.onScoreUpdate) {
              this.ui.onScoreUpdate(this.score, this.combo, this.stars, this.multiplier, this.currentMedalTier, scorePct, accuracyPct);
            }
          }
        }
      }
    }

    for (const [lane, active] of this.activeHolds.entries()) {
      const note = active.note;
      const endT = note.end_timestamp_ms || (note.timestamp_ms + (note.duration_ms || 700));
      const hitX = (lane + 0.5) * this.laneWidth;
      const holdColor = (active.color && active.color !== '#00ff88' && active.color !== '#00f2fe') ? active.color : '#ffe082';
      
      this.particles.emitHoldSpark(hitX, this.hitLineY, holdColor);
      this.addScore(Math.round(260 * dt * this.multiplier));

      // Keep vignette alive and colored during full_focus holds
      if (this.activeEffect && this.activeEffect.startsWith('full_focus')) {
        this.vignetteColor = holdColor;
        this.vignetteAlpha = Math.max(this.vignetteAlpha, 0.55);
      }

      if (currentTime >= endT) {
        note.holdCompleted = true;
        note.hit = true;
        note.holding = false;
        this.activeHolds.delete(lane);
        this.emitKeyHit(hitX, this.hitLineY, holdColor, 35);
        this.addJudgement('HOLD CLEAR!', '#ffe082');
      }
    }

    this.updateVisualEffects(dt);

    if (this.beatmapData && this.notes.length > 0 && !this.isGameOver) {
      const lastNoteTime = Math.max(...this.notes.map(n => n.end_timestamp_ms || n.timestamp_ms));
      const hasExplicitEnd = Number.isFinite(this.beatmapData.endMarkerMs) && this.beatmapData.endMarkerMs > 0;
      const endLimitMs = hasExplicitEnd
        ? this.beatmapData.endMarkerMs
        : (Number.isFinite(this.beatmapData.endTimestampMs) && this.beatmapData.endTimestampMs > 0
            ? this.beatmapData.endTimestampMs
            : (lastNoteTime + 1400));

      const isPastEnd = currentTime >= endLimitMs;
      const isPastLastNote = !hasExplicitEnd && (currentTime > (lastNoteTime + 1400));
      const isAudioFinished = this.sync.duration > 0 && (currentTime / 1000 >= this.sync.duration - 0.25);

      if (isPastEnd || isPastLastNote || isAudioFinished) {
        this.triggerGameEnd();
      }
    }
  }

  triggerGameEnd() {
    if (this.isGameOver || !this.beatmapData) return;
    this.isGameOver = true;
    this.isRunning = false;
    this.isPaused = true;
    if (this.animFrameId) {
      cancelAnimationFrame(this.animFrameId);
      this.animFrameId = null;
    }
    this.sync.pause();

    const totalNotes = (this.notes && this.notes.length) || 0;
    const maxScore = Math.max(1, this.maxPossibleScore || 1);
    const scorePct = Math.min(100.0, Math.max(0.0, (this.score / maxScore) * 100));

    // Precisión de impacto física:
    const totalJudged = (this.stats.perfectPlus || 0) + (this.stats.perfect || 0) + (this.stats.great || 0) + (this.stats.good || 0) + (this.stats.miss || 0);
    const accuracyPct = totalJudged > 0
      ? Math.min(100.0, Math.max(0.0, (((this.stats.perfectPlus * 100) + (this.stats.perfect * 80) + (this.stats.great * 50) + ((this.stats.good || 0) * 25)) / (totalJudged * 100)) * 100))
      : 100.0;

    // La evaluación de estrellas y medallas se rige ESTRICTAMENTE por scorePct:
    // 5★: >= 90% | 4★: >= 75% | 3★: >= 60% | 2★: >= 40% | 1★: >= 20%
    let stars = 0;
    if (scorePct >= 90.0) {
      stars = 5;
    } else if (scorePct >= 75.0) {
      stars = 4;
    } else if (scorePct >= 60.0) {
      stars = 3;
    } else if (scorePct >= 40.0) {
      stars = 2;
    } else if (scorePct >= 20.0) {
      stars = 1;
    }
    this.stars = Math.max(this.stars, stars);

    // Medallas: Requiere un mínimo de 100 notas en la pista
    // Plata: >= 92% | Oro: >= 94% | Platino: >= 96%
    let finalMedal = null;
    const earnedMedals = { silver: 0, gold: 0, platinum: 0 };
    if (totalNotes >= 100) {
      if (scorePct >= 96.0) {
        finalMedal = 'platinum';
        earnedMedals.platinum = 1;
        earnedMedals.gold = 1;
        earnedMedals.silver = 1;
      } else if (scorePct >= 94.0) {
        finalMedal = 'gold';
        earnedMedals.gold = 1;
        earnedMedals.silver = 1;
      } else if (scorePct >= 92.0) {
        finalMedal = 'silver';
        earnedMedals.silver = 1;
      }
    }
    this.currentMedalTier = finalMedal;

    // Claves (Clefs) - Reducidas 10 VECES (1 a 5 claves base + bonos de 1 a 3):
    const diffStars = this.beatmapData.metadata?.stars || 3.0;
    let diffMultiplier = diffStars < 3.0 ? 1 : (diffStars < 6.0 ? 1.2 : 1.5);

    const scoreRatio = Math.min(1.0, Math.max(0.0, this.score / maxScore));
    const performanceFactor = Math.pow(scoreRatio, 1.4) * (accuracyPct / 100);
    // Escala base: 1 a 5 claves
    const baseScoreClefs = Math.max(1, Math.round(5 * performanceFactor));
    const scoreClefs = Math.max(1, Math.round(baseScoreClefs * diffMultiplier));

    // Bonos de medallas reducidos 10 veces: Platino +3, Oro +2, Plata +1
    const medalBonus = (earnedMedals.platinum * 3) + (earnedMedals.gold * 2) + (earnedMedals.silver * 1);
    const earnedClefs = scoreClefs + medalBonus;

    if (this.ui && this.ui.onGameEnd) {
      this.ui.onGameEnd(this.score, this.maxCombo, this.stars, this.stats, earnedClefs, finalMedal, scorePct, earnedMedals, totalNotes, accuracyPct);
    }
  }

  updateVisualEffects(dt) {
    if (this.shakeDuration > 0) {
      this.shakeDuration = Math.max(0, this.shakeDuration - dt);
    }

    // Number Ticker líquido continuo: interpolación suave de puntuación (displayScore += (targetScore - displayScore) * 0.15)
    if (typeof this.displayScore !== 'number') this.displayScore = 0;
    if (Math.abs(this.displayScore - this.score) > 0.05) {
      this.displayScore += (this.score - this.displayScore) * 0.15;
      if (Math.abs(this.displayScore - this.score) < 0.5) {
        this.displayScore = this.score;
      }
      const sVal = Math.min(999999, Math.max(0, Math.floor(this.displayScore)));
      const scoreStr = String(sVal).padStart(6, "0");
      for (let d = 0; d < 6; d++) {
        const strip = document.getElementById(`rollerDigit${5 - d}`);
        if (strip) {
          const digitVal = parseInt(scoreStr[d], 10) || 0;
          strip.style.transform = `translateY(-${digitVal * 24}px)`;
        }
      }
      const hudScoreEl = document.getElementById('hudScore');
      if (hudScoreEl) {
        hudScoreEl.innerText = Math.floor(this.displayScore).toLocaleString();
      }
    }

    // Física de la Bola de Discoteca (Aparece y desciende ÚNICAMENTE a partir de combo 200)
    if (this.discoBall) {
      const is200Combo = (this.combo >= 200);
      if (is200Combo) {
        this.discoBall.active = true;
        this.discoBall.targetY = 86; // Posición suspendida bajo el contador de estrellas
      } else {
        this.discoBall.targetY = -120; // Asciende y se oculta en el techo
      }

      if (this.discoBall.descendY < this.discoBall.targetY) {
        this.discoBall.descendY += (this.discoBall.targetY - this.discoBall.descendY) * Math.min(1, dt * 2.8);
      } else if (this.discoBall.descendY > this.discoBall.targetY) {
        this.discoBall.descendY += (this.discoBall.targetY - this.discoBall.descendY) * Math.min(1, dt * 4.2);
      }

      if (!is200Combo && this.discoBall.descendY <= -105) {
        this.discoBall.active = false;
      }

      if (this.discoBall.active || this.discoBall.descendY > -100) {
        const activeBpm = this.currentBpm || (this.beatmapData && this.beatmapData.metadata ? this.beatmapData.metadata.bpm : 128) || 128;
        const bpmFactor = activeBpm / 120;
        this.discoBall.rotation += this.discoBall.rotSpeed * dt * (0.85 + 0.40 * bpmFactor);
      }
    }

    if (this.topComboToast) {
      const t = this.topComboToast;
      t.age += dt;
      if (t.age < 0.12) {
        const p = t.age / 0.12;
        t.scale = 1.5 - 0.5 * Math.sin(p * Math.PI * 0.5);
      } else {
        t.scale = 1.0;
      }
      if (t.age > t.duration - 0.35) {
        t.alpha = Math.max(0, (t.duration - t.age) / 0.35);
      }
      if (t.age >= t.duration) {
        this.topComboToast = null;
      }
    }

    // Actualizar Explosiones 3D Cinemáticas y Partículas en Profundidad
    if (this.combo3DExplosions && this.combo3DExplosions.length > 0) {
      for (let i = this.combo3DExplosions.length - 1; i >= 0; i--) {
        const exp = this.combo3DExplosions[i];
        exp.age += dt;
        exp.radius += (exp.maxRadius - exp.radius) * 4.2 * dt;
        exp.rotation += 0.65 * dt;

        // Rebote elástico del rótulo 3D
        if (exp.age < 0.18) {
          const p = exp.age / 0.18;
          exp.scale = 1.0 + 0.70 * Math.cos(p * Math.PI * 0.5);
        } else {
          exp.scale = 1.0 + 0.04 * Math.sin((exp.age - 0.18) * 3.5);
        }

        if (exp.age > exp.duration - 0.45) {
          exp.alpha = Math.max(0, (exp.duration - exp.age) / 0.45);
        }

        // Simulación 3D de chispas
        if (exp.sparks) {
          for (let s = exp.sparks.length - 1; s >= 0; s--) {
            const sp = exp.sparks[s];
            sp.x += sp.vx * dt;
            sp.y += sp.vy * dt;
            sp.z += (sp.vz || 0) * dt;
            sp.vy += 140 * dt;
            sp.rot += (sp.rotSpeed || 0) * dt;
            sp.alpha -= (sp.decay || 2.0) * dt;
            if (sp.alpha <= 0) exp.sparks.splice(s, 1);
          }
        }

        if (exp.age >= exp.duration) {
          this.combo3DExplosions.splice(i, 1);
        }
      }
    }

    // Progresión de transición de color ambiental de la atmósfera
    if (this.atmosphereShiftProgress < 1.0) {
      this.atmosphereShiftProgress = Math.min(1.0, this.atmosphereShiftProgress + dt * 1.8);
    }

    for (let l = 0; l < 3; l++) {
      this.laneGlows[l] = Math.max(0, (this.laneGlows[l] || 0) - dt * 4.0);
      if (this.laneFlashTimers[l] > 0) {
        this.laneFlashTimers[l] = Math.max(0, this.laneFlashTimers[l] - dt);
      }
    }

    for (let i = this.judgements.length - 1; i >= 0; i--) {
      const j = this.judgements[i];
      j.age += dt;
      // Compresión elástica visual: nace en 1.45 y se comprime a 1.0 en 90ms (0.09s)
      if (j.age < 0.09) {
        const p = j.age / 0.09;
        j.scale = 1.0 + 0.45 * Math.cos(p * Math.PI * 0.5);
      } else {
        j.scale = 1.0;
        j.alpha -= dt * 2.8;
      }
      // Flota 15px hacia arriba mientras decae la opacidad
      j.y = j.baseY - Math.min(15, (j.age / 0.35) * 15);
      if (j.alpha <= 0) this.judgements.splice(i, 1);
    }

    for (let i = this.fxRipples.length - 1; i >= 0; i--) {
      const r = this.fxRipples[i];
      r.radius += (r.maxRadius - r.radius) * 7.5 * dt;
      r.alpha -= r.decay * dt;
      if (r.alpha <= 0) this.fxRipples.splice(i, 1);
    }

    for (let i = this.bgBursts.length - 1; i >= 0; i--) {
      const b = this.bgBursts[i];
      b.radius += (b.maxRadius - b.radius) * 5.5 * dt;
      if (b.rotation !== undefined) {
        b.rotation += (b.rotSpeed || 0) * dt;
      }
      if (b.progress !== undefined) {
        b.progress = Math.min(1.0, b.progress + dt * 2.2);
      }
      b.alpha -= b.decay * dt;
      if (b.alpha <= 0) this.bgBursts.splice(i, 1);
    }

    if (this.vignetteAlpha > 0.001) {
      this.vignetteAlpha = Math.max(0, this.vignetteAlpha - dt * 3.2);
    }

    if (this.reactiveLightBoost > 0.001) {
      this.reactiveLightBoost = Math.max(0, this.reactiveLightBoost - dt * 1.5);
    }

    for (let i = this.musicalNotes.length - 1; i >= 0; i--) {
      const mn = this.musicalNotes[i];
      mn.wobble += dt * 5.0;
      mn.x += (mn.vx + Math.sin(mn.wobble) * 22) * dt;
      mn.y += mn.vy * dt;
      mn.vy += 30 * dt;
      mn.rot += mn.rotSpeed * dt;
      mn.alpha -= mn.decay * dt;
      mn.scale += dt * 0.15;
      if (mn.alpha <= 0) this.musicalNotes.splice(i, 1);
    }

    this.particles.update(dt);
  }

  /**
   * Canvas Background & Concert Atmosphere:
   * Fondos atmosféricos dinámicos de estadio con iluminación volumétrica,
   * focos móviles, estelas de velocidad en perspectiva y apoteosis reactiva al BPM y multiplicador.
   */
  renderBackgroundFX(currentTime) {
    const ctx = this.ctx;
    const w = this.width;
    const h = this.height;
    if (!w || !h) return;

    const palette = this.activeSongPalette || (typeof SONG_COLOR_PALETTES !== 'undefined' ? SONG_COLOR_PALETTES.classic : { primary: '#c5a059', secondary: '#ede5d8', glow: '#c5a059', ribs: '#e5b869', spotlight1: '#c5a059', spotlight2: '#8c6d23', spark: '#fff3cf' });

    const mult = this.multiplier || 1;
    const bpm = (this.beatmapData && this.beatmapData.bpm) ? Math.max(40, this.beatmapData.bpm) : (this.bpm || 120);
    const beatInterval = 60 / bpm;
    const audioTime = Math.max(0, currentTime) / 1000;
    const beatFraction = ((audioTime % beatInterval) + beatInterval) % beatInterval / beatInterval;
    const beatPulse = Math.pow(Math.max(0, 1 - beatFraction), 2.8);

    const hexToRgba = (hex, alpha) => {
      const a = Math.max(0, Math.min(1, alpha));
      if (typeof hex === 'string' && hex.startsWith('#')) {
        const c = hex.slice(1);
        const r = parseInt(c.substring(0, 2), 16) || 255;
        const g = parseInt(c.substring(2, 4), 16) || 0;
        const b = parseInt(c.substring(4, 6), 16) || 128;
        return `rgba(${r}, ${g}, ${b}, ${a.toFixed(3)})`;
      }
      return `rgba(197, 160, 89, ${a.toFixed(3)})`;
    };

    // 1. GRADIENTE ATMOSFÉRICO DE ESTADIO SEGÚN MULTIPLICADOR (Sin oscurecer bruscamente la pantalla)
    const bgGrad = ctx.createLinearGradient(0, 0, 0, h);
    if (mult >= 5) {
      // 5x FEVER DIAMANTE: Apoteosis Prismática / Púrpura Real y Dorado Radiante
      bgGrad.addColorStop(0.0, '#100322');
      bgGrad.addColorStop(0.35, '#2b0846');
      bgGrad.addColorStop(0.70, '#4a116d');
      bgGrad.addColorStop(1.0, '#220836');
    } else if (mult === 4) {
      // 4x HIPER VELOCIDAD: Cian Eléctrico y Azul Cobalto Cyber
      bgGrad.addColorStop(0.0, '#031224');
      bgGrad.addColorStop(0.40, '#082d4f');
      bgGrad.addColorStop(0.75, '#0c4472');
      bgGrad.addColorStop(1.0, '#061e35');
    } else if (mult === 3) {
      // 3x FIEBRE RÍTMICA: Magenta Neón y Violeta Profundo
      bgGrad.addColorStop(0.0, '#140324');
      bgGrad.addColorStop(0.40, '#32063e');
      bgGrad.addColorStop(0.75, '#500a5e');
      bgGrad.addColorStop(1.0, '#240430');
    } else if (mult === 2) {
      // 2x BUILDUP: Ámbar Dorado y Bronce
      bgGrad.addColorStop(0.0, '#0d0716');
      bgGrad.addColorStop(0.40, '#221509');
      bgGrad.addColorStop(0.75, '#361d0d');
      bgGrad.addColorStop(1.0, '#180d07');
    } else {
      // 1x BASE: Escenario Índigo / Medianoche Profundo
      bgGrad.addColorStop(0.0, '#060310');
      bgGrad.addColorStop(0.45, '#0e0920');
      bgGrad.addColorStop(0.80, '#181030');
      bgGrad.addColorStop(1.0, '#0e081e');
    }
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, w, h);

    // Resplandor aditivo difuminado si hubo cambio de atmósfera (sin oscurecer jamás)
    if (this.targetAtmosphereColor && this.atmosphereShiftProgress < 1.0) {
      ctx.save();
      ctx.globalCompositeOperation = 'lighter';
      const shiftAlpha = (1.0 - this.atmosphereShiftProgress) * 0.40;
      const atmRad = Math.max(w, h) * 0.85;
      const atmGrad = ctx.createRadialGradient(w / 2, h * 0.35, 10, w / 2, h * 0.35, atmRad);
      atmGrad.addColorStop(0.0, hexToRgba(this.targetAtmosphereColor, shiftAlpha));
      atmGrad.addColorStop(0.55, hexToRgba(this.targetAtmosphereColor, shiftAlpha * 0.35));
      atmGrad.addColorStop(1.0, 'rgba(0, 0, 0, 0)');
      ctx.fillStyle = atmGrad;
      ctx.fillRect(0, 0, w, h);
      ctx.restore();
    }

    // Ondas expansivas de fondo de la explosión 3D (Shockwave Background Wash)
    if (this.combo3DExplosions && this.combo3DExplosions.length > 0) {
      ctx.save();
      ctx.globalCompositeOperation = 'lighter';
      for (const exp of this.combo3DExplosions) {
        if (exp.radius < 10) continue;
        const washGrad = ctx.createRadialGradient(exp.originX, exp.originY, Math.max(0, exp.radius * 0.2), exp.originX, exp.originY, exp.radius);
        const expAlpha = exp.alpha * 0.55;
        washGrad.addColorStop(0.0, hexToRgba(exp.color || '#ffd700', expAlpha * 0.6));
        washGrad.addColorStop(0.65, hexToRgba(exp.color || '#ffd700', expAlpha * 0.3));
        washGrad.addColorStop(1.0, 'rgba(0, 0, 0, 0)');
        ctx.fillStyle = washGrad;
        ctx.beginPath();
        ctx.arc(exp.originX, exp.originY, exp.radius, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
    }

    // Strobe estroboscópico de estadio al compás del bombo en modo Fiebre (5x)
    if (mult >= 5 && beatPulse > 0.45) {
      ctx.save();
      ctx.fillStyle = `rgba(255, 255, 255, ${(beatPulse * 0.14).toFixed(3)})`;
      ctx.fillRect(0, 0, w, h);
      ctx.restore();
    }

    // 1b. Fondo personalizado si está activo
    if (this.customBgMode === 'static' && this.customBgMedia) {
      ctx.save();
      ctx.globalAlpha = Math.max(0.05, Math.min(0.9, this.customBgOpacity || 0.40));
      this.drawCoverMedia(ctx, this.customBgMedia, w, h);
      ctx.restore();
    }

    // Intensidades y velocidad según multiplicador
    let stageIntensity = 0.65;
    let swingFreq = 0.0011;
    let beamColor1 = palette.spotlight1 || '#9b51e0';
    let beamColor2 = palette.spotlight2 || '#ff5964';

    if (mult === 2) {
      stageIntensity = 0.90;
      swingFreq = 0.0015;
      beamColor1 = '#ffd700';
      beamColor2 = '#ff9900';
    } else if (mult === 3) {
      stageIntensity = 1.15;
      swingFreq = 0.0020;
      beamColor1 = '#ff007f';
      beamColor2 = '#d946ef';
    } else if (mult === 4) {
      stageIntensity = 1.40;
      swingFreq = 0.0026;
      beamColor1 = '#00f2fe';
      beamColor2 = '#38bdf8';
    } else if (mult >= 5) {
      stageIntensity = 1.70;
      swingFreq = 0.0032;
      beamColor1 = '#ffffff';
      beamColor2 = '#ffd700';
    }

    ctx.save();
    ctx.globalCompositeOperation = 'lighter';

    // 2. RESPLANDOR RADIAL DE HORIZONTE REACTIVO AL BPM (Horizon Stage Aura)
    const horizY = Math.max(12, h * 0.02);
    const auraRad = Math.max(w * 0.55, 200);
    const auraGrad = ctx.createRadialGradient(w / 2, horizY, 8, w / 2, horizY, auraRad);
    const auraAlpha = Math.min(0.65, (0.20 + beatPulse * 0.35) * stageIntensity);
    auraGrad.addColorStop(0.0, hexToRgba(beamColor1, auraAlpha));
    auraGrad.addColorStop(0.40, hexToRgba(beamColor2, auraAlpha * 0.45));
    auraGrad.addColorStop(1.0, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = auraGrad;
    ctx.fillRect(0, 0, w, h * 0.55);

    // 3. FOCOS ZENITALES MÓVILES VOLUMÉTRICOS (Conos de luz de concierto)
    // Foco Izquierdo
    const spot1BaseX = w * 0.15;
    const spot1Swing = Math.sin(currentTime * swingFreq) * (w * 0.45);
    const spot1TargetX = (w * 0.50) + spot1Swing;
    const spot1TargetY = h * 0.90;

    const grad1 = ctx.createRadialGradient(spot1BaseX, -10, 5, spot1TargetX, spot1TargetY, w * 0.75);
    grad1.addColorStop(0, hexToRgba(beamColor1, 0.28 * stageIntensity));
    grad1.addColorStop(0.45, hexToRgba(beamColor1, 0.08 * stageIntensity));
    grad1.addColorStop(1, 'rgba(0,0,0,0)');

    ctx.fillStyle = grad1;
    ctx.beginPath();
    ctx.moveTo(spot1BaseX - 30, -10);
    ctx.lineTo(spot1BaseX + 30, -10);
    ctx.lineTo(spot1TargetX + (w * 0.22 * (1 + beatPulse * 0.2)), spot1TargetY);
    ctx.lineTo(spot1TargetX - (w * 0.22 * (1 + beatPulse * 0.2)), spot1TargetY);
    ctx.closePath();
    ctx.fill();

    // Foco Derecho
    const spot2BaseX = w * 0.85;
    const spot2Swing = Math.sin(currentTime * swingFreq + 1.4) * (w * 0.45);
    const spot2TargetX = (w * 0.50) - spot2Swing;
    const spot2TargetY = h * 0.90;

    const grad2 = ctx.createRadialGradient(spot2BaseX, -10, 5, spot2TargetX, spot2TargetY, w * 0.75);
    grad2.addColorStop(0, hexToRgba(beamColor2, 0.28 * stageIntensity));
    grad2.addColorStop(0.45, hexToRgba(beamColor2, 0.08 * stageIntensity));
    grad2.addColorStop(1, 'rgba(0,0,0,0)');

    ctx.fillStyle = grad2;
    ctx.beginPath();
    ctx.moveTo(spot2BaseX - 30, -10);
    ctx.lineTo(spot2BaseX + 30, -10);
    ctx.lineTo(spot2TargetX + (w * 0.22 * (1 + beatPulse * 0.2)), spot2TargetY);
    ctx.lineTo(spot2TargetX - (w * 0.22 * (1 + beatPulse * 0.2)), spot2TargetY);
    ctx.closePath();
    ctx.fill();

    // Focos adicionales en combo alto (3x, 4x, 5x)
    if (mult >= 3) {
      const spot3BaseX = w * 0.50;
      const spot3Swing = Math.cos(currentTime * swingFreq * 1.3) * (w * 0.40);
      const spot3TargetX = (w * 0.50) + spot3Swing;
      const spot3TargetY = h * 0.92;

      const grad3 = ctx.createRadialGradient(spot3BaseX, -10, 5, spot3TargetX, spot3TargetY, w * 0.65);
      grad3.addColorStop(0, hexToRgba('#ffffff', 0.22 * stageIntensity));
      grad3.addColorStop(0.5, hexToRgba(beamColor1, 0.06 * stageIntensity));
      grad3.addColorStop(1, 'rgba(0,0,0,0)');

      ctx.fillStyle = grad3;
      ctx.beginPath();
      ctx.moveTo(spot3BaseX - 20, -10);
      ctx.lineTo(spot3BaseX + 20, -10);
      ctx.lineTo(spot3TargetX + (w * 0.16), spot3TargetY);
      ctx.lineTo(spot3TargetX - (w * 0.16), spot3TargetY);
      ctx.closePath();
      ctx.fill();
    }

    // 4. ONDAS DE SONIDO SINUSOIDALES ELÉCTRICAS DE ESTADIO (Sincronizadas al BPM y Combo)
    if (mult >= 2) {
      const activeBpm = this.currentBpm || (this.beatmapData && this.beatmapData.metadata ? this.beatmapData.metadata.bpm : 128) || 128;
      const bpmPhase = (currentTime * activeBpm / 60000) * Math.PI * 2;
      const waveCount = mult >= 4 ? 4 : 2;

      for (let wIdx = 0; wIdx < waveCount; wIdx++) {
        const waveProgress = ((currentTime * 0.0014 + (wIdx / waveCount)) % 1.0);
        const waveBaseRad = 35 + waveProgress * (w * 0.72);
        const waveAlpha = (1.0 - waveProgress) * (0.08 + mult * 0.06 + beatPulse * 0.12) * stageIntensity;
        const waveCol = (wIdx % 2 === 0) ? beamColor1 : beamColor2;

        const waveSteps = 44;
        const waveFreq = 6 + mult * 2.5; // Más picos eléctricos a mayor combo
        const waveAmp = (3.5 + mult * 2.2) * (0.5 + 0.5 * Math.sin(bpmPhase + wIdx)) * (0.6 + 0.4 * beatPulse);

        ctx.strokeStyle = hexToRgba(waveCol, waveAlpha);
        ctx.lineWidth = Math.max(1.2, (1.6 + mult * 0.4) * (1.0 - waveProgress * 0.5));
        ctx.beginPath();
        for (let s = 0; s <= waveSteps; s++) {
          const theta = (s / waveSteps) * Math.PI * 2;
          const sineOffset = Math.sin(theta * waveFreq + currentTime * 0.012 + bpmPhase) * waveAmp;
          const curR = Math.max(4, waveBaseRad + sineOffset);
          const px = (w / 2) + Math.cos(theta) * curR * 1.35;
          const py = horizY + Math.sin(theta) * curR * 0.72;
          if (s === 0) ctx.moveTo(px, py);
          else ctx.lineTo(px, py);
        }
        ctx.closePath();
        ctx.stroke();
      }
    }

    // 5. ESTELAS DE VELOCIDAD HIPERSÓNICAS (Short Warp Dashes - Gran multitud de líneas cortas y ultrarrápidas)
    if (mult >= 2) {
      const targetCount = Math.min(120, 28 + mult * 20);
      if (!this.speedStreaks) this.speedStreaks = [];
      while (this.speedStreaks.length < targetCount) {
        this.speedStreaks.push({
          angle: -0.85 + Math.random() * 1.70,
          speed: 1.8 + Math.random() * 2.6,
          progress: Math.random(),
          len: 0.018 + Math.random() * 0.035, // Líneas cortas y electrizantes
          side: Math.random() > 0.5 ? 1 : -1,
          col: Math.random() > 0.45 ? beamColor1 : beamColor2,
          thick: 1.1 + Math.random() * 2.0,
          lateralShift: (Math.random() - 0.5) * 0.25
        });
      }

      for (let i = 0; i < this.speedStreaks.length; i++) {
        const s = this.speedStreaks[i];
        const warpSpeed = (0.9 + mult * 0.55);
        s.progress += 0.018 * s.speed * warpSpeed;
        if (s.progress > 1.0) {
          s.progress = 0;
          s.speed = 1.8 + Math.random() * 2.6;
          s.len = 0.018 + Math.random() * 0.035;
          s.side = Math.random() > 0.5 ? 1 : -1;
          s.col = Math.random() > 0.45 ? beamColor1 : beamColor2;
          s.lateralShift = (Math.random() - 0.5) * 0.25;
        }

        const p1 = s.progress;
        const p2 = Math.min(1.0, p1 + s.len);
        const xCenter = w / 2;
        const yCenter = horizY;

        const startRad = 35 + p1 * (w * 0.88);
        const endRad = 35 + p2 * (w * 0.88);

        const spread1 = 0.44 + 0.56 * p1;
        const x1 = xCenter + s.side * (w * (0.38 + s.lateralShift) + startRad * 0.45) * spread1;
        const y1 = yCenter + Math.pow(p1, 1.35) * h * 0.98;

        const spread2 = 0.44 + 0.56 * p2;
        const x2 = xCenter + s.side * (w * (0.38 + s.lateralShift) + endRad * 0.45) * spread2;
        const y2 = yCenter + Math.pow(p2, 1.35) * h * 0.98;

        const streakAlpha = Math.sin(p1 * Math.PI) * (0.32 + 0.12 * mult) * stageIntensity;
        ctx.strokeStyle = hexToRgba(s.col || beamColor1, streakAlpha);
        ctx.lineWidth = s.thick * (0.7 + 0.4 * p1);
        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
        ctx.stroke();

        // Punta incandescente de la estela
        ctx.fillStyle = hexToRgba('#ffffff', streakAlpha * 0.9);
        ctx.beginPath();
        ctx.arc(x2, y2, s.thick * 0.7, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    // 5. MOTAS DE POLVO ESCÉNICO Y DESTELLOS FLOTANTES
    if (!this.stageDustMotes || this.stageDustMotes.length === 0) {
      this.stageDustMotes = [];
      for (let i = 0; i < 28; i++) {
        this.stageDustMotes.push({
          x: Math.random() * w,
          y: Math.random() * h,
          r: 1.0 + Math.random() * 2.4,
          speed: 0.35 + Math.random() * 0.65,
          phase: Math.random() * Math.PI * 2,
          alpha: 0.15 + Math.random() * 0.35
        });
      }
    }

    for (let i = 0; i < this.stageDustMotes.length; i++) {
      const m = this.stageDustMotes[i];
      m.y -= m.speed * (mult >= 3 ? 1.5 : 1.0);
      m.x += Math.sin(m.phase + currentTime * 0.0016) * 0.5;
      if (m.y < -10) {
        m.y = h + 10;
        m.x = Math.random() * w;
      }
      ctx.fillStyle = hexToRgba(beamColor1, m.alpha * (0.5 + 0.5 * beatPulse));
      ctx.beginPath();
      ctx.arc(m.x, m.y, m.r, 0, Math.PI * 2);
      ctx.fill();
    }

    // 6. REFLEJOS ESPECULARES EN EL SUELO BAJO LAS NOTAS
    const hitY = Number.isFinite(this.hitLineY) ? this.hitLineY : (h * 0.84);
    if (Array.isArray(this.notes)) {
      let drawnReflections = 0;
      for (let i = 0; i < this.notes.length; i++) {
        const n = this.notes[i];
        if (n.consumed || n.hit || n.missed) continue;
        const noteTime = n.timeMs || n.timestamp_ms || 0;
        const diff = noteTime - currentTime;
        if (diff > 500) break;
        if (diff >= -50 && diff <= 500 && drawnReflections < 3) {
          const laneCoord = this.getPerspectiveCoord(n.lane, 1.0 - (diff / (this.scrollDurationMs || 1000)));
          if (laneCoord && laneCoord.y > hitY * 0.4) {
            drawnReflections++;
            const refAlpha = Math.max(0, Math.min(0.22, (1 - diff / 500) * 0.22));
            const refGrad = ctx.createRadialGradient(laneCoord.x, hitY + 12, 5, laneCoord.x, hitY + 12, laneCoord.laneW * 0.65);
            refGrad.addColorStop(0, hexToRgba(beamColor1, refAlpha));
            refGrad.addColorStop(1, 'rgba(0,0,0,0)');
            ctx.fillStyle = refGrad;
            ctx.beginPath();
            ctx.ellipse(laneCoord.x, hitY + 12, laneCoord.laneW * 0.65, 14, 0, 0, Math.PI * 2);
            ctx.fill();
          }
        }
      }
    }

    ctx.restore();

    // 7. Full Focus Vignette Ambient Flash (Modo aditivo luminoso que jamás oscurece la pantalla)
    if (this.vignetteAlpha > 0.01) {
      ctx.save();
      ctx.globalCompositeOperation = 'lighter';
      const vGrad = ctx.createRadialGradient(w / 2, h / 2, Math.min(w, h) * 0.28, w / 2, h / 2, Math.max(w, h) * 0.82);
      vGrad.addColorStop(0, 'rgba(0, 0, 0, 0)');
      vGrad.addColorStop(0.60, hexToRgba(this.vignetteColor || beamColor1, this.vignetteAlpha * 0.22));
      vGrad.addColorStop(1, hexToRgba(this.vignetteColor || beamColor1, this.vignetteAlpha * 0.40));
      ctx.fillStyle = vGrad;
      ctx.fillRect(0, 0, w, h);
      ctx.restore();
    }

    const effect = this.activeEffect || 'default_neon';
    const isReactiveActive = this.customBgMode === 'reactive' && !!this.customBgMedia;
    if (!isReactiveActive && (effect === 'default_neon' || this.bgBursts.length === 0)) {
      return;
    }

    try {

      // ====================================================
      // 1. CHORROS DE PINTURA (Graffiti & Manchas de Acuarela por toda la pantalla)
      // ====================================================
      if (effect === 'paint_splash') {
        ctx.save();
        ctx.globalCompositeOperation = 'screen';
        for (const b of this.bgBursts) {
          if (b.alpha <= 0.01) continue;

          // A. Expansión de halo de acuarela en el fondo
          const washRadius = b.radius * 1.4;
          const washGrad = ctx.createRadialGradient(b.x, b.y, 5, b.x, b.y, washRadius);
          washGrad.addColorStop(0, hexToRgba(b.color1, b.alpha * 0.28));
          washGrad.addColorStop(0.5, hexToRgba(b.color2, b.alpha * 0.14));
          washGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
          ctx.fillStyle = washGrad;
          ctx.beginPath();
          ctx.arc(b.x, b.y, washRadius, 0, Math.PI * 2);
          ctx.fill();

          // B. Manchas orgánicas de pintura y estelas de gotas disparadas
          if (b.blotches) {
            for (const blotch of b.blotches) {
              const progress = 1 - (b.alpha / 0.9);
              const curDist = blotch.dist + (blotch.maxDist - blotch.dist) * progress;
              const bx = b.x + Math.cos(blotch.angle) * curDist;
              const by = b.y + Math.sin(blotch.angle) * curDist;
              const curR = blotch.radius * (0.4 + b.alpha * 0.6);

              // 1. Estela conectora fluida
              ctx.strokeStyle = hexToRgba(blotch.color, b.alpha * 0.16);
              ctx.lineWidth = Math.max(1, curR * 0.3);
              ctx.beginPath();
              ctx.moveTo(b.x, b.y);
              ctx.quadraticCurveTo((b.x + bx) / 2 + Math.sin(blotch.angle) * 20, (b.y + by) / 2, bx, by);
              ctx.stroke();

              // 2. Mancha principal
              ctx.fillStyle = hexToRgba(blotch.color, b.alpha * 0.30);
              ctx.beginPath();
              ctx.arc(bx, by, curR, 0, Math.PI * 2);
              ctx.fill();

              // 3. Gotas satélite
              if (blotch.subDrops) {
                for (const sd of blotch.subDrops) {
                  ctx.fillStyle = hexToRgba(blotch.color, b.alpha * 0.26);
                  ctx.beginPath();
                  ctx.arc(bx + sd.dx, by + sd.dy, sd.r * (0.5 + b.alpha * 0.5), 0, Math.PI * 2);
                  ctx.fill();
                }
              }
            }
          }
        }
        ctx.restore();
        return;
      }

      // ====================================================
      // 2. MODO FUEGO / INFIERNO (Cintas de Fuego Serpentino y Vórtice de Magma)
      // ====================================================
      if (effect === 'fire_inferno') {
        ctx.save();
        ctx.globalCompositeOperation = 'screen';
        for (const b of this.bgBursts) {
          if (b.alpha <= 0.01) continue;

          // A. Resplandor térmico suave que inunda la pantalla al toque
          const heatRadius = b.radius * 1.5;
          const heatGrad = ctx.createRadialGradient(b.x, b.y, 10, b.x, b.y, heatRadius);
          heatGrad.addColorStop(0, hexToRgba('#ff8800', b.alpha * 0.28));
          heatGrad.addColorStop(0.5, hexToRgba('#ff2200', b.alpha * 0.14));
          heatGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
          ctx.fillStyle = heatGrad;
          ctx.fillRect(0, 0, w, h);

          // B. Llamaradas serpentinas ascendentes
          if (b.flames) {
            for (const fl of b.flames) {
              const wave = Math.sin((1 - b.alpha) * 8 + fl.phase) * fl.curveOffsetX;
              const midX = (b.x + fl.targetX) / 2 + wave;
              const midY = (b.y + 0) / 2;

              const flGrad = ctx.createLinearGradient(b.x, b.y, fl.targetX, 0);
              flGrad.addColorStop(0, hexToRgba('#ffffff', b.alpha * 0.38));
              flGrad.addColorStop(0.35, hexToRgba(fl.color, b.alpha * 0.28));
              flGrad.addColorStop(0.75, hexToRgba('#ff0033', b.alpha * 0.16));
              flGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');

              ctx.strokeStyle = flGrad;
              ctx.lineWidth = fl.width * (0.4 + b.alpha * 0.6);
              ctx.lineCap = 'round';
              ctx.beginPath();
              ctx.moveTo(b.x, b.y);
              ctx.quadraticCurveTo(midX, midY, fl.targetX, 0);
              ctx.stroke();
            }
          }
        }
        ctx.restore();
        return;
      }

      // ====================================================
      // 3. EXPLOSIONES DE COLOR NEÓN (Rayos Supernova y Ondas Celestiales)
      // ====================================================
      if (effect === 'color_burst') {
        ctx.save();
        ctx.globalCompositeOperation = 'screen';
        for (const b of this.bgBursts) {
          if (b.alpha <= 0.01) continue;

          // A. Ondas concéntricas de distorsión neón
          const warpRadius = b.radius * 1.5;
          const warpGrad = ctx.createRadialGradient(b.x, b.y, 10, b.x, b.y, warpRadius);
          warpGrad.addColorStop(0, hexToRgba(b.color1, b.alpha * 0.30));
          warpGrad.addColorStop(0.45, hexToRgba(b.color2, b.alpha * 0.16));
          warpGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
          ctx.fillStyle = warpGrad;
          ctx.beginPath();
          ctx.arc(b.x, b.y, warpRadius, 0, Math.PI * 2);
          ctx.fill();

          // B. Rayos Supernova giratorios por toda la pantalla
          if (b.rays) {
            ctx.save();
            ctx.translate(b.x, b.y);
            ctx.rotate(b.rotation || 0);

            for (const ray of b.rays) {
              const curLen = ray.len * (0.6 + (1 - b.alpha) * 0.8);
              const rayGrad = ctx.createLinearGradient(0, 0, Math.cos(ray.angle) * curLen, Math.sin(ray.angle) * curLen);
              rayGrad.addColorStop(0, hexToRgba('#ffffff', b.alpha * 0.35));
              rayGrad.addColorStop(0.4, hexToRgba(ray.color, b.alpha * 0.26));
              rayGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');

              ctx.strokeStyle = rayGrad;
              ctx.lineWidth = ray.width * (0.5 + b.alpha * 0.5);
              ctx.beginPath();
              ctx.moveTo(0, 0);
              ctx.lineTo(Math.cos(ray.angle) * curLen, Math.sin(ray.angle) * curLen);
              ctx.stroke();
            }
            ctx.restore();
          }
        }
        ctx.restore();
        return;
      }

      // ====================================================
      // 4. FONDO REACTIVO: ILUMINACIÓN ADITIVA DINÁMICA (MÁS TECLAS = MÁS LUZ)
      // ====================================================
      if (this.customBgMode === 'reactive' && this.customBgMedia) {
        const hasBursts = this.bgBursts.some(b => b.type === 'reactive_reveal' && b.alpha > 0.01);
        const hasHolds = this.activeHolds.size > 0;
        const hasBoost = (this.reactiveLightBoost || 0) > 0.01;

        if (hasBursts || hasHolds || hasBoost) {
          const spotScale = 0.5;
          const spotW = Math.max(160, Math.round(w * spotScale));
          const spotH = Math.max(160, Math.round(h * spotScale));
          if (!this.spotlightCanvas || this.spotlightCanvas.width !== spotW || this.spotlightCanvas.height !== spotH) {
            this.spotlightCanvas = document.createElement('canvas');
            this.spotlightCanvas.width = spotW;
            this.spotlightCanvas.height = spotH;
            this.spotlightCtx = this.spotlightCanvas.getContext('2d');
          }
          const sCtx = this.spotlightCtx;
          sCtx.clearRect(0, 0, spotW, spotH);

          // PASO 1: Dibujar todas las fuentes de luz en la máscara usando 'lighter' (ADITIVO: más teclas = más luz, NUNCA se queda negro!)
          sCtx.save();
          sCtx.scale(spotScale, spotScale);
          sCtx.globalCompositeOperation = 'lighter';

          // A. Resplandor ambiental reactivo acumulado por ráfagas de notas
          if (hasBoost) {
            const ambGrad = sCtx.createRadialGradient(w / 2, this.hitLineY, 20, w / 2, this.hitLineY, Math.max(w, h));
            const boostA = Math.min(0.70, (this.reactiveLightBoost || 0) * 0.70);
            ambGrad.addColorStop(0, `rgba(255, 255, 255, ${boostA.toFixed(3)})`);
            ambGrad.addColorStop(0.5, `rgba(255, 255, 255, ${(boostA * 0.45).toFixed(3)})`);
            ambGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
            sCtx.fillStyle = ambGrad;
            sCtx.fillRect(0, 0, w, h);
          }

          // B. Cada onda expansiva de cada tecla pulsada suma luz
          for (const b of this.bgBursts) {
            if (b.type !== 'reactive_reveal' || b.alpha <= 0.01) continue;
            const rad = Math.max(20, b.radius);
            const grad = sCtx.createRadialGradient(b.x, b.y, 0, b.x, b.y, rad);
            const a = Math.min(1.0, b.alpha);
            grad.addColorStop(0, `rgba(255, 255, 255, ${a.toFixed(3)})`);
            grad.addColorStop(0.35, `rgba(255, 255, 255, ${(a * 0.85).toFixed(3)})`);
            grad.addColorStop(0.70, `rgba(255, 255, 255, ${(a * 0.40).toFixed(3)})`);
            grad.addColorStop(1, 'rgba(255, 255, 255, 0)');
            sCtx.fillStyle = grad;
            sCtx.beginPath();
            sCtx.arc(b.x, b.y, rad, 0, Math.PI * 2);
            sCtx.fill();
          }

          // C. Cada nota mantenida (hold) añade un haz de luz continuo
          for (const [holdLane] of this.activeHolds.entries()) {
            const hx = (holdLane + 0.5) * this.laneWidth;
            const hy = this.hitLineY;
            const hRad = this.laneWidth * 1.8;
            const grad = sCtx.createRadialGradient(hx, hy, 0, hx, hy, hRad);
            grad.addColorStop(0, 'rgba(255, 255, 255, 0.95)');
            grad.addColorStop(0.5, 'rgba(255, 255, 255, 0.60)');
            grad.addColorStop(1, 'rgba(255, 255, 255, 0)');
            sCtx.fillStyle = grad;
            sCtx.beginPath();
            sCtx.arc(hx, hy, hRad, 0, Math.PI * 2);
            sCtx.fill();
          }
          sCtx.restore();

          // PASO 2: Recortar la imagen o vídeo con la máscara de luz sumada (source-in)
          sCtx.save();
          sCtx.globalCompositeOperation = 'source-in';
          sCtx.scale(spotScale, spotScale);
          this.drawCoverMedia(sCtx, this.customBgMedia, w, h);
          sCtx.restore();

          // PASO 3: Dibujar la escena iluminada sobre el fondo negro base
          ctx.save();
          ctx.drawImage(this.spotlightCanvas, 0, 0, w, h);

          // PASO 4: Halo de onda expansiva perimetral con el color exacto del juicio (Perfect+, Perfect, Great, Good)
          ctx.globalCompositeOperation = 'screen';
          for (const b of this.bgBursts) {
            if (b.type !== 'reactive_reveal' || b.alpha <= 0.01) continue;
            const rad = Math.max(15, b.radius);
            const rimCol = b.color || '#00f2fe';
            const rim = ctx.createRadialGradient(b.x, b.y, Math.max(0, rad - 35), b.x, b.y, rad);
            rim.addColorStop(0, 'rgba(0, 0, 0, 0)');
            rim.addColorStop(0.65, hexToRgba(rimCol, b.alpha * 0.45));
            rim.addColorStop(1, 'rgba(0, 0, 0, 0)');
            ctx.fillStyle = rim;
            ctx.beginPath();
            ctx.arc(b.x, b.y, rad, 0, Math.PI * 2);
            ctx.fill();
          }
          ctx.restore();
        }
        return;
      }
    } catch (fxErr) {
      console.warn('Background FX warning:', fxErr);
    }
  }

  render() {
    this.ctx.clearRect(0, 0, this.width, this.height);
    const hasShake = (this.shakeDuration > 0);
    if (hasShake) {
      this.ctx.save();
      const sx = (Math.random() - 0.5) * 2 * (this.shakeIntensity || 2);
      const sy = (Math.random() - 0.5) * 2 * (this.shakeIntensity || 2);
      this.ctx.translate(sx, sy);
    }

    const currentTime = this.getCurrentGameTimeMs();

    this.renderBackgroundFX(currentTime);
    this.renderDiscoLighting(this.ctx, currentTime);
    this.renderLanes(currentTime);
    this.renderDiscoTrackLightBeams(this.ctx, currentTime);
    this.renderHitLine();
    this.renderRipples(this.ctx);
    this.renderNotes(currentTime);
    this.renderSwipeLaunches(this.ctx, currentTime);
    this.particles.render(this.ctx);
    this.renderMusicalNotes();
    this.renderJudgements();
    this.renderDiscoBall(this.ctx, currentTime);
    this.render3DComboExplosion(this.ctx);

    if (hasShake) {
      this.ctx.restore();
    }
  }

  renderSwipeLaunches(ctx, currentTime) {
    if (!this.activeSwipeLaunches || this.activeSwipeLaunches.length === 0) return;
    const now = performance.now();
    const isLarge = this.keyStyle === 'beatstar_large';

    for (let i = this.activeSwipeLaunches.length - 1; i >= 0; i--) {
      const launch = this.activeSwipeLaunches[i];
      const elapsed = now - launch.startTime;
      if (elapsed > launch.duration) {
        this.activeSwipeLaunches.splice(i, 1);
        continue;
      }

      const progress = Math.max(0, Math.min(1, elapsed / launch.duration)); // 0 to 1
      const easeOutQuad = 1 - (1 - progress) * (1 - progress);
      const easeInCubic = progress * progress * progress;

      // Trayectoria de eyección balística hacia la dirección del deslizamiento
      const curX = launch.x + (launch.vx * (elapsed / 1000));
      const curY = launch.y + (launch.vy * (elapsed / 1000));
      const curScale = Math.max(0.25, (1.0 + progress * 0.45) * (1.0 - easeInCubic * 0.6));
      const curAlpha = Math.max(0, 1.0 - Math.pow(progress, 1.5));
      const curRot = launch.rot * progress * 2.8;

      ctx.save();
      ctx.globalAlpha = curAlpha;
      ctx.translate(curX, curY);
      ctx.rotate(curRot);
      ctx.scale(curScale, curScale);

      const keyW = (this.laneWidth || 100) * 0.78;
      const keyH = isLarge ? 58 : 30;

      // 1. Estela de propulsión hipersónica luminosa
      ctx.save();
      ctx.globalCompositeOperation = 'lighter';
      const trailLenX = -launch.vx * 0.05;
      const trailLenY = -launch.vy * 0.05;
      const trailGrad = ctx.createLinearGradient(0, 0, trailLenX, trailLenY);
      trailGrad.addColorStop(0.0, hexToRgba(launch.color, 0.95));
      trailGrad.addColorStop(0.40, hexToRgba('#ffffff', 0.85));
      trailGrad.addColorStop(1.0, 'rgba(255, 255, 255, 0)');
      ctx.fillStyle = trailGrad;
      ctx.beginPath();
      ctx.moveTo(-keyW / 2, -keyH / 2);
      ctx.lineTo(keyW / 2, -keyH / 2);
      ctx.lineTo((keyW / 4) + trailLenX, trailLenY);
      ctx.lineTo((-keyW / 4) + trailLenX, trailLenY);
      ctx.closePath();
      ctx.fill();
      ctx.restore();

      // 2. Tecla marfil en 3D saliendo proyectada
      const keyGrad = ctx.createLinearGradient(0, -keyH / 2, 0, keyH / 2);
      keyGrad.addColorStop(0.0, '#ffffff');
      keyGrad.addColorStop(0.3, '#f5f7fa');
      keyGrad.addColorStop(0.75, '#d9e0e8');
      keyGrad.addColorStop(1.0, '#a8b2c0');

      ctx.fillStyle = keyGrad;
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 2.4;
      ctx.shadowColor = launch.color;
      ctx.shadowBlur = 20 * (1 - progress);

      if (ctx.roundRect) ctx.roundRect(-keyW / 2, -keyH / 2, keyW, keyH, 8);
      else ctx.rect(-keyW / 2, -keyH / 2, keyW, keyH);
      ctx.fill();
      ctx.stroke();

      // 3. Chevrón vectorial brillante de la dirección
      this.renderVectorChevron(ctx, 0, 0, launch.dir, keyW, keyH);

      ctx.restore();
    }
  }

  render3DComboExplosion(ctx) {
    if ((!this.combo3DExplosions || this.combo3DExplosions.length === 0) && !this.topComboToast) return;
    const explosions = (this.combo3DExplosions && this.combo3DExplosions.length > 0) ? this.combo3DExplosions : [this.topComboToast];

    for (const exp of explosions) {
      if (!exp || exp.alpha <= 0.01) continue;
      const w = this.width;
      const h = this.height;
      const midX = exp.originX || (w / 2);
      const topY = Math.max(120, Math.min(210, h * 0.18));
      const expAlpha = Math.max(0, Math.min(1, exp.alpha));
      const col = exp.color || '#ffd700';
      const rgb = hexToRgb(col);

      ctx.save();

      // 1. GRAN NEBULOSA AMBIENTAL DIFUMINADA (Soft Gaussian-Style Radial Ambient Bloom)
      ctx.save();
      ctx.globalCompositeOperation = 'lighter';
      const bloomRad = Math.min(w * 0.95, 340);
      const bloomGrad = ctx.createRadialGradient(midX, topY + 10, 0, midX, topY + 10, bloomRad);
      bloomGrad.addColorStop(0.0, `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${(0.42 * expAlpha).toFixed(3)})`);
      bloomGrad.addColorStop(0.25, `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${(0.22 * expAlpha).toFixed(3)})`);
      bloomGrad.addColorStop(0.60, `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${(0.08 * expAlpha).toFixed(3)})`);
      bloomGrad.addColorStop(1.0, 'rgba(0, 0, 0, 0)');
      ctx.fillStyle = bloomGrad;
      ctx.beginPath();
      ctx.arc(midX, topY + 10, bloomRad, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();

      // 2. RAYOS ETÉREOS DE LUZ SUAVE Y DIFUMINADA (Feathered Volumetric Aurora Beams)
      if (exp.rays && exp.age < exp.duration * 0.85) {
        ctx.save();
        ctx.globalCompositeOperation = 'lighter';
        ctx.translate(midX, topY + 15);
        ctx.rotate(exp.rotation * 0.6);
        const rayProgress = exp.age / (exp.duration * 0.85);
        const rayAlpha = Math.max(0, (1 - rayProgress) * 0.28 * expAlpha);

        for (const ray of exp.rays) {
          ctx.save();
          ctx.rotate(ray.angle);
          const rGrad = ctx.createLinearGradient(0, 0, ray.length * 0.85, 0);
          const rayRgb = hexToRgb(ray.color || col);
          rGrad.addColorStop(0.0, `rgba(${rayRgb.r}, ${rayRgb.g}, ${rayRgb.b}, ${rayAlpha.toFixed(3)})`);
          rGrad.addColorStop(0.35, `rgba(${rayRgb.r}, ${rayRgb.g}, ${rayRgb.b}, ${(rayAlpha * 0.40).toFixed(3)})`);
          rGrad.addColorStop(0.70, `rgba(${rayRgb.r}, ${rayRgb.g}, ${rayRgb.b}, ${(rayAlpha * 0.10).toFixed(3)})`);
          rGrad.addColorStop(1.0, 'rgba(0, 0, 0, 0)');
          ctx.fillStyle = rGrad;
          ctx.beginPath();
          ctx.moveTo(0, -ray.width * 0.7);
          ctx.lineTo(ray.length * 0.85, 0);
          ctx.lineTo(0, ray.width * 0.7);
          ctx.closePath();
          ctx.fill();
          ctx.restore();
        }
        ctx.restore();
      }

      // 3. ONDAS DE CHOQUE SUAVEMENTE DIFUMINADAS (Feathered Halo Shockwave)
      if (exp.radius > 5) {
        ctx.save();
        ctx.globalCompositeOperation = 'lighter';
        const shockRad = exp.radius;
        const shockGrad = ctx.createRadialGradient(midX, topY + 15, Math.max(0, shockRad - 35), midX, topY + 15, shockRad + 20);
        const shockAlpha = (1 - (exp.radius / exp.maxRadius)) * 0.35 * expAlpha;
        shockGrad.addColorStop(0.0, 'rgba(0, 0, 0, 0)');
        shockGrad.addColorStop(0.50, `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${shockAlpha.toFixed(3)})`);
        shockGrad.addColorStop(0.75, `rgba(255, 255, 255, ${(shockAlpha * 0.55).toFixed(3)})`);
        shockGrad.addColorStop(1.0, 'rgba(0, 0, 0, 0)');
        ctx.fillStyle = shockGrad;
        ctx.beginPath();
        ctx.arc(midX, topY + 15, shockRad + 20, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }

      // 4. POLVO DE CHISPAS BOKEH Y PARTÍCULAS DIFUMINADAS (Soft Glowing Bokeh Orbs)
      if (exp.sparks && exp.sparks.length > 0) {
        ctx.save();
        ctx.globalCompositeOperation = 'lighter';
        for (const sp of exp.sparks) {
          if (sp.alpha <= 0.01) continue;
          const zScale = Math.max(0.3, 1.0 + (sp.z / 260));
          const pRad = Math.max(1.5, sp.radius * zScale * 1.8);
          const pAlpha = Math.max(0, Math.min(1, sp.alpha * expAlpha * 0.65));
          const spRgb = hexToRgb(sp.color || col);

          const sparkGrad = ctx.createRadialGradient(sp.x, sp.y, 0, sp.x, sp.y, pRad);
          sparkGrad.addColorStop(0.0, `rgba(255, 255, 255, ${pAlpha.toFixed(3)})`);
          sparkGrad.addColorStop(0.40, `rgba(${spRgb.r}, ${spRgb.g}, ${spRgb.b}, ${(pAlpha * 0.70).toFixed(3)})`);
          sparkGrad.addColorStop(1.0, 'rgba(0, 0, 0, 0)');
          ctx.fillStyle = sparkGrad;
          ctx.beginPath();
          ctx.arc(sp.x, sp.y, pRad, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.restore();
      }

      // 5. TIPOGRAFÍA ELEGANTE CON RESPLANDOR ETÉREO DIFUMINADO
      ctx.save();
      ctx.globalAlpha = expAlpha;
      ctx.translate(midX, topY);
      ctx.scale(exp.scale, exp.scale);

      const hasSub = Boolean(exp.subtext);
      const titleText = String(exp.title || '').toUpperCase();
      const subText = String(exp.subtext || '').toUpperCase();

      // Resplandor difuso exterior (Multi-layer soft bloom)
      ctx.font = '900 22px "Plus Jakarta Sans", "Outfit", system-ui, sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';

      ctx.save();
      ctx.shadowColor = col;
      ctx.shadowBlur = 28;
      ctx.fillStyle = `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.85)`;
      ctx.fillText(titleText, 0, 0);
      ctx.restore();

      ctx.save();
      ctx.shadowColor = '#ffffff';
      ctx.shadowBlur = 12;
      ctx.fillStyle = '#ffffff';
      ctx.fillText(titleText, 0, 0);
      ctx.restore();

      // Subtítulo con cápsula luminosa etérea (sin oscurecer jamás la pista)
      if (hasSub) {
        const subY = 22;
        ctx.font = '800 10.5px "Plus Jakarta Sans", "Outfit", system-ui, sans-serif';
        const subMetrics = ctx.measureText(subText);
        const pillW = Math.max(90, subMetrics.width + 20);
        const pillH = 19;

        // Base difuminada luminosa translúcida
        ctx.save();
        ctx.fillStyle = `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.22)`;
        if (ctx.roundRect) ctx.roundRect(-pillW / 2, subY - pillH / 2, pillW, pillH, 9.5);
        else ctx.rect(-pillW / 2, subY - pillH / 2, pillW, pillH);
        ctx.fill();

        // Borde fino brillante
        ctx.strokeStyle = `rgba(255, 255, 255, 0.70)`;
        ctx.lineWidth = 1.0;
        ctx.stroke();
        ctx.restore();

        // Texto suave
        ctx.fillStyle = '#ffffff';
        ctx.shadowColor = col;
        ctx.shadowBlur = 8;
        ctx.fillText(subText, 0, subY);
      }

      ctx.restore();
      ctx.restore();
    }
  }

  renderDiscoLighting(ctx, currentTime) {
    if (!this.discoBall || (!this.discoBall.active && this.discoBall.descendY <= -80)) return;
    const w = this.width, h = this.height;
    const midX = w / 2;
    const nowSec = performance.now() / 1000;
    const swayX = Math.sin(nowSec * 1.3) * 3.0;
    const bobY = Math.sin(nowSec * 2.4) * 1.5;
    const ballX = midX + swayX;
    const ballY = this.discoBall.descendY + bobY;
    if (ballY < -40) return; // Fuera de la parte visible

    const beatPulse = (typeof this.getBeatPulse === 'function') ? this.getBeatPulse() : 0;
    const rot = this.discoBall.rotation;
    // Visibilidad suave en base a la altura
    const visAlpha = Math.max(0, Math.min(1, (ballY + 40) / 100));

    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    ctx.globalAlpha = visAlpha;

    // 1. RAYOS VOLUMÉTRICOS GIRATORIOS SUTILES (Subtle Rotating 3D Laser & Club Beams)
    const numBeams = 12;
    const beamLength = Math.max(w, h) * 1.2;
    const beamPalette = [
      { r: 255, g: 255, b: 255 }, // White
      { r: 0, g: 242, b: 254 },   // Cyan
      { r: 255, g: 0, b: 127 },   // Magenta
      { r: 251, g: 191, b: 36 },  // Golden Amber
      { r: 168, g: 85, b: 247 },  // Electric Violet
      { r: 52, g: 211, b: 153 }   // Emerald Laser
    ];

    for (let b = 0; b < numBeams; b++) {
      const harmonicSweep = Math.sin(nowSec * 1.5 + b * 0.7) * 0.06;
      const angle = rot * (0.9 + (b % 3) * 0.1) + (b * (Math.PI * 2 / numBeams)) + harmonicSweep;
      const rgb = beamPalette[b % beamPalette.length];
      const beamSpread = 0.06 + 0.018 * Math.sin(nowSec * 3.0 + b);
      const beamIntensity = (0.016 + 0.014 * (1.0 + beatPulse * 0.4));

      ctx.save();
      ctx.translate(ballX, ballY);
      ctx.rotate(angle);

      const bGrad = ctx.createLinearGradient(0, 0, beamLength, 0);
      bGrad.addColorStop(0.0, `rgba(255, 255, 255, ${(beamIntensity * 1.2).toFixed(3)})`);
      bGrad.addColorStop(0.20, `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${(beamIntensity * 0.7).toFixed(3)})`);
      bGrad.addColorStop(0.60, `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${(beamIntensity * 0.2).toFixed(3)})`);
      bGrad.addColorStop(1.0, 'rgba(0, 0, 0, 0)');

      ctx.fillStyle = bGrad;
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(beamLength, -Math.tan(beamSpread) * beamLength);
      ctx.lineTo(beamLength, Math.tan(beamSpread) * beamLength);
      ctx.closePath();
      ctx.fill();
      ctx.restore();
    }

    // 3. DESTELLOS Y REFLEJOS DANZANTES SUTILES POR EL ESCENARIO (Soft Dancing Mirror Flecks)
    if (this.discoBall.specks && this.discoBall.specks.length > 0) {
      for (const sp of this.discoBall.specks) {
        const curAngle = sp.theta + rot * sp.speed;
        const distRatio = sp.dist;
        const spreadX = (w * 1.05) * distRatio;
        const spreadY = (h * 0.80) * distRatio;
        const sx = ballX + Math.cos(curAngle) * spreadX;
        const sy = ballY + Math.sin(curAngle) * spreadY + (sp.phi * h * 0.40);

        if (sx < -40 || sx > w + 40 || sy < -40 || sy > h + 40) continue;

        const rgb = beamPalette[sp.colorIdx % beamPalette.length];
        const shimmer = 0.55 + 0.45 * Math.sin(nowSec * sp.shimmerSpeed + sp.shimmerPhase);
        const rad = (sp.size * 0.75) * (1.0 + beatPulse * 0.3) * (0.85 + shimmer * 0.30);
        const alpha = Math.min(0.35, sp.brightness * shimmer * (0.16 + beatPulse * 0.18));

        // Reflejo con forma romboidal suave
        ctx.save();
        ctx.translate(sx, sy);
        ctx.rotate(curAngle * 0.5);

        const sGrad = ctx.createRadialGradient(0, 0, 0, 0, 0, rad * 1.3);
        sGrad.addColorStop(0.0, `rgba(255, 255, 255, ${alpha.toFixed(3)})`);
        sGrad.addColorStop(0.35, `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${(alpha * 0.65).toFixed(3)})`);
        sGrad.addColorStop(1.0, 'rgba(0, 0, 0, 0)');

        ctx.fillStyle = sGrad;
        ctx.beginPath();
        ctx.moveTo(0, -rad);
        ctx.lineTo(rad * 1.1, 0);
        ctx.lineTo(0, rad);
        ctx.lineTo(-rad * 1.1, 0);
        ctx.closePath();
        ctx.fill();

        // Núcleo suave
        ctx.fillStyle = `rgba(255, 255, 255, ${(alpha * 0.7).toFixed(3)})`;
        ctx.beginPath();
        ctx.arc(0, 0, rad * 0.3, 0, Math.PI * 2);
        ctx.fill();

        ctx.restore();
      }
    }

    ctx.restore();
  }

  renderDiscoTrackLightBeams(ctx, currentTime) {
    if (!this.discoBall || (!this.discoBall.active && this.discoBall.descendY <= -80)) return;
    const w = this.width, h = this.height;
    const midX = w / 2;
    const nowSec = performance.now() / 1000;
    const swayX = Math.sin(nowSec * 1.3) * 3.0;
    const bobY = Math.sin(nowSec * 2.4) * 1.5;
    const ballX = midX + swayX;
    const ballY = this.discoBall.descendY + bobY;
    if (ballY < -50) return;

    const horizonY = Number.isFinite(this.horizonY) ? this.horizonY : (h * 0.22);
    const hitY = Number.isFinite(this.hitLineY) ? this.hitLineY : (h * 0.84);
    const bottomY = h;

    const tL_top = this.getLaneBoundaryX(0, horizonY);
    const tR_top = this.getLaneBoundaryX(3, horizonY);
    const tL_bot = this.getLaneBoundaryX(0, bottomY);
    const tR_bot = this.getLaneBoundaryX(3, bottomY);

    const rot = this.discoBall.rotation || 0;
    const beatPulse = (typeof this.getBeatPulse === 'function') ? this.getBeatPulse() : 0;
    const visAlpha = Math.max(0, Math.min(1, (ballY + 40) / 100));

    ctx.save();
    // Clip a la superficie de la pista blanca (Highway perspective)
    ctx.beginPath();
    ctx.moveTo(tL_top, horizonY);
    ctx.lineTo(tR_top, horizonY);
    ctx.lineTo(tR_bot, bottomY);
    ctx.lineTo(tL_bot, bottomY);
    ctx.closePath();
    ctx.clip();

    ctx.globalCompositeOperation = 'lighter';
    ctx.globalAlpha = visAlpha;

    // Paleta de reflejos de discoteca auténtica y sutil
    const beamPalette = [
      { r: 255, g: 255, b: 255 }, // Diamante blanco
      { r: 224, g: 242, b: 254 }, // Cian ártico muy claro
      { r: 254, g: 243, b: 199 }, // Champagne dorado suave
      { r: 243, g: 232, b: 255 }, // Lavanda neón sutil
      { r: 209, g: 250, b: 229 }, // Menta tenue
      { r: 255, g: 228, b: 230 }  // Rosa pétalo tenue
    ];

    // 1. Haces de luz que bajan de la bola e impactan sutilmente sobre la pista blanca
    const numTrackBeams = 8;
    for (let i = 0; i < numTrackBeams; i++) {
      const harmonic = Math.sin(nowSec * 1.8 + i * 1.1) * 0.08;
      const angle = rot * 1.15 + (i * (Math.PI * 2 / numTrackBeams)) + harmonic;
      
      const sinA = Math.sin(angle);
      const cosA = Math.cos(angle);
      if (cosA <= -0.15) continue; // Solo rayos que proyectan hacia abajo

      const trackProgress = 0.20 + 0.70 * ((sinA + 1) * 0.5);
      const projY = horizonY + (hitY - horizonY) * trackProgress;
      const leftAtY = this.getLaneBoundaryX(0, projY);
      const rightAtY = this.getLaneBoundaryX(3, projY);
      const projX = leftAtY + (rightAtY - leftAtY) * (0.5 + sinA * 0.44);

      const rgb = beamPalette[i % beamPalette.length];
      const intensity = (0.035 + 0.025 * Math.sin(nowSec * 3.2 + i * 1.7)) * (1.0 + beatPulse * 0.35);

      // Haz volumétrico fino que baña el carril
      const bGrad = ctx.createLinearGradient(ballX, ballY, projX, projY);
      bGrad.addColorStop(0.0, `rgba(255, 255, 255, ${(intensity * 0.7).toFixed(3)})`);
      bGrad.addColorStop(0.40, `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${(intensity * 0.35).toFixed(3)})`);
      bGrad.addColorStop(1.0, `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${(intensity * 0.85).toFixed(3)})`);

      const beamHalfW = Math.max(10, 24 * trackProgress);
      ctx.fillStyle = bGrad;
      ctx.beginPath();
      ctx.moveTo(ballX - 3, ballY);
      ctx.lineTo(projX - beamHalfW, projY);
      ctx.lineTo(projX + beamHalfW, projY);
      ctx.lineTo(ballX + 3, ballY);
      ctx.closePath();
      ctx.fill();

      // Punto de contacto elíptico en perspectiva sobre la pista blanca
      const spotGrad = ctx.createRadialGradient(projX, projY, 2, projX, projY, beamHalfW * 1.3);
      spotGrad.addColorStop(0.0, `rgba(255, 255, 255, ${(intensity * 1.4).toFixed(3)})`);
      spotGrad.addColorStop(0.45, `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${(intensity * 0.75).toFixed(3)})`);
      spotGrad.addColorStop(1.0, 'rgba(0, 0, 0, 0)');
      ctx.fillStyle = spotGrad;
      ctx.beginPath();
      ctx.ellipse(projX, projY, beamHalfW * 1.3, beamHalfW * 0.60, 0, 0, Math.PI * 2);
      ctx.fill();
    }

    // 2. Destellos sutiles de espejitos en perspectiva danzando sobre el marfil de los carriles
    const numSpots = 16;
    for (let s = 0; s < numSpots; s++) {
      const sweepPhase = (rot * 0.90 + s * (Math.PI * 2 / numSpots)) % (Math.PI * 2);
      const sweepXRatio = 0.5 + 0.45 * Math.sin(sweepPhase);
      const depthRatio = 0.12 + 0.84 * ((Math.cos(sweepPhase * 1.3 + s) + 1) * 0.5);

      const sy = horizonY + (hitY - horizonY) * depthRatio;
      const xL = this.getLaneBoundaryX(0, sy);
      const xR = this.getLaneBoundaryX(3, sy);
      const sx = xL + (xR - xL) * sweepXRatio;

      const spotR = (5.0 + 9.0 * depthRatio) * (1.0 + beatPulse * 0.25);
      const rgb = beamPalette[(s + 2) % beamPalette.length];
      const spotAlpha = (0.045 + 0.040 * Math.sin(nowSec * 3.8 + s * 2.3)) * (1.0 + beatPulse * 0.35);

      const fGrad = ctx.createRadialGradient(sx, sy, 1, sx, sy, spotR * 1.4);
      fGrad.addColorStop(0.0, `rgba(255, 255, 255, ${(spotAlpha * 1.6).toFixed(3)})`);
      fGrad.addColorStop(0.35, `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${(spotAlpha * 0.8).toFixed(3)})`);
      fGrad.addColorStop(1.0, 'rgba(0, 0, 0, 0)');

      ctx.fillStyle = fGrad;
      ctx.beginPath();
      ctx.ellipse(sx, sy, spotR * 1.3, spotR * 0.50, rot * 0.25, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.restore();
  }

  renderDiscoBall(ctx, currentTime) {
    if (!this.discoBall || (!this.discoBall.active && this.discoBall.descendY <= -80)) return;
    const w = this.width;
    const midX = w / 2;
    const nowSec = performance.now() / 1000;
    const swayX = Math.sin(nowSec * 1.3) * 3.0;
    const bobY = Math.sin(nowSec * 2.4) * 1.5;
    const ballX = midX + swayX;
    const ballY = this.discoBall.descendY + bobY;
    if (ballY < -50) return; // Fuera de pantalla

    const radius = this.discoBall.radius || 27;
    const rot = this.discoBall.rotation;
    const beatPulse = (typeof this.getBeatPulse === 'function') ? this.getBeatPulse() : 0;
    const visAlpha = Math.max(0, Math.min(1, (ballY + 40) / 100));

    ctx.save();
    ctx.globalAlpha = visAlpha;

    // 1. CUERDECILLA METÁLICA CROMADA DE SUSPENSIÓN (Braided Silver Steel Cord)
    ctx.save();
    ctx.strokeStyle = '#f8fafc';
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.moveTo(midX, 0);
    ctx.lineTo(ballX, ballY - radius - 3);
    ctx.stroke();

    // Detalle de eslabones de cadena reflectantes
    ctx.strokeStyle = '#cbd5e1';
    ctx.lineWidth = 0.8;
    ctx.beginPath();
    ctx.moveTo(midX, 0);
    ctx.lineTo(ballX, ballY - radius - 3);
    ctx.stroke();
    ctx.restore();

    // 2. ENGANCHE Y MOTOR ROTATORIO CROMADO SUPERIOR
    ctx.save();
    const capGrad = ctx.createLinearGradient(ballX - 7, ballY - radius - 8, ballX + 7, ballY - radius);
    capGrad.addColorStop(0.0, '#ffffff');
    capGrad.addColorStop(0.40, '#cbd5e1');
    capGrad.addColorStop(1.0, '#64748b');
    ctx.fillStyle = capGrad;
    ctx.beginPath();
    ctx.arc(ballX, ballY - radius - 3, 4.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.9)';
    ctx.lineWidth = 0.8;
    ctx.stroke();
    ctx.restore();

    // 3. BASE DE LA ESFERA DE ESPEJO CROMADA (3D Chrome Sphere Gradient Base)
    ctx.save();
    const sphereGrad = ctx.createRadialGradient(
      ballX - radius * 0.40,
      ballY - radius * 0.40,
      1,
      ballX,
      ballY,
      radius
    );
    sphereGrad.addColorStop(0.0, '#ffffff');
    sphereGrad.addColorStop(0.20, '#f8fafc');
    sphereGrad.addColorStop(0.55, '#e2e8f0');
    sphereGrad.addColorStop(0.85, '#94a3b8');
    sphereGrad.addColorStop(1.0, '#64748b');
    ctx.fillStyle = sphereGrad;
    ctx.beginPath();
    ctx.arc(ballX, ballY, radius, 0, Math.PI * 2);
    ctx.fill();

    // Clip circular para facetas de espejo
    ctx.beginPath();
    ctx.arc(ballX, ballY, radius, 0, Math.PI * 2);
    ctx.clip();

    // 4. MALLA 3D HIPERREALISTA DE AZULEJOS DE ESPEJO (High-Precision 3D Mirror Tiles)
    const latBands = this.discoBall.latBands || 13;
    const lonSegments = this.discoBall.lonSegments || 26;
    const spotlights = this.discoBall.spotlights || [
      { x: -0.65, y: -0.55, z: 0.52, color: '#ffffff', rgb: { r: 255, g: 255, b: 255 }, power: 1.1 },
      { x: 0.70, y: -0.45, z: 0.55, color: '#00f2fe', rgb: { r: 0, g: 242, b: 254 }, power: 0.95 },
      { x: -0.25, y: -0.75, z: 0.60, color: '#ff007f', rgb: { r: 255, g: 0, b: 127 }, power: 1.0 },
      { x: 0.40, y: -0.60, z: 0.70, color: '#fbbf24', rgb: { r: 251, g: 191, b: 36 }, power: 0.9 }
    ];

    const starburstFlares = [];

    for (let i = 0; i < latBands; i++) {
      const lat0 = -Math.PI * 0.44 + (i / latBands) * (Math.PI * 0.88);
      const lat1 = -Math.PI * 0.44 + ((i + 1) / latBands) * (Math.PI * 0.88);

      const cosLat0 = Math.cos(lat0), sinLat0 = Math.sin(lat0);
      const cosLat1 = Math.cos(lat1), sinLat1 = Math.sin(lat1);

      for (let j = 0; j < lonSegments; j++) {
        const lon0 = rot + (j / lonSegments) * Math.PI * 2;
        const lon1 = rot + ((j + 1) / lonSegments) * Math.PI * 2;

        const cosLon0 = Math.cos(lon0), sinLon0 = Math.sin(lon0);
        const cosLon1 = Math.cos(lon1), sinLon1 = Math.sin(lon1);

        // Vértices 3D
        const x00 = radius * cosLat0 * sinLon0;
        const y00 = -radius * sinLat0;
        const z00 = radius * cosLat0 * cosLon0;

        const x10 = radius * cosLat0 * sinLon1;
        const y10 = -radius * sinLat0;
        const z10 = radius * cosLat0 * cosLon1;

        const x11 = radius * cosLat1 * sinLon1;
        const y11 = -radius * sinLat1;
        const z11 = radius * cosLat1 * cosLon1;

        const x01 = radius * cosLat1 * sinLon0;
        const y01 = -radius * sinLat1;
        const z01 = radius * cosLat1 * cosLon0;

        const avgZ = (z00 + z10 + z11 + z01) * 0.25;
        if (avgZ <= -0.5) continue; // Ocultar cara trasera

        const avgX = (x00 + x10 + x11 + x01) * 0.25;
        const avgY = (y00 + y10 + y11 + y01) * 0.25;

        // Vector normal
        const normLen = Math.hypot(avgX, avgY, avgZ) || 1;
        const nx = avgX / normLen;
        const ny = avgY / normLen;
        const nz = avgZ / normLen;

        // Calcular iluminación combinada de los 4 focos
        let totalR = 75 + nz * 40;
        let totalG = 75 + nz * 40;
        let totalB = 90 + nz * 45;
        let maxFacetSpecular = 0;
        let dominantColor = { r: 255, g: 255, b: 255 };

        for (const spot of spotlights) {
          const dot = nx * spot.x + ny * spot.y + nz * spot.z;
          if (dot > 0) {
            const spec = Math.pow(dot, 14) * spot.power;
            const diff = dot * 0.45;
            totalR += (spot.rgb.r * diff * 0.35) + (spot.rgb.r * spec * 0.85);
            totalG += (spot.rgb.g * diff * 0.35) + (spot.rgb.g * spec * 0.85);
            totalB += (spot.rgb.b * diff * 0.35) + (spot.rgb.b * spec * 0.85);

            if (spec > maxFacetSpecular) {
              maxFacetSpecular = spec;
              dominantColor = spot.rgb;
            }
          }
        }

        totalR = Math.min(255, Math.floor(totalR));
        totalG = Math.min(255, Math.floor(totalG));
        totalB = Math.min(255, Math.floor(totalB));

        // Dibujar azulejo de espejo con bordes limpios sin sombras
        ctx.fillStyle = `rgb(${totalR}, ${totalG}, ${totalB})`;
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.22)';
        ctx.lineWidth = 0.5;

        ctx.beginPath();
        ctx.moveTo(ballX + x00, ballY + y00);
        ctx.lineTo(ballX + x10, ballY + y10);
        ctx.lineTo(ballX + x11, ballY + y11);
        ctx.lineTo(ballX + x01, ballY + y01);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        // Destello especular sutil en azulejos alineados
        if (maxFacetSpecular > 0.55) {
          const specAlpha = Math.min(0.40, (maxFacetSpecular - 0.55) * 0.9);
          ctx.fillStyle = `rgba(255, 255, 255, ${specAlpha.toFixed(2)})`;
          ctx.beginPath();
          ctx.moveTo(ballX + x00, ballY + y00);
          ctx.lineTo(ballX + x10, ballY + y10);
          ctx.lineTo(ballX + x11, ballY + y11);
          ctx.lineTo(ballX + x01, ballY + y01);
          ctx.closePath();
          ctx.fill();

          if (maxFacetSpecular > 0.78 && starburstFlares.length < 2) {
            starburstFlares.push({
              x: ballX + avgX,
              y: ballY + avgY,
              intensity: maxFacetSpecular,
              rgb: dominantColor
            });
          }
        }
      }
    }

    ctx.restore(); // Quita el clip

    // 5. RESPLANDOR PERIMETRAL Y BISEL METÁLICO SUTIL (Subtle Rim Lighting)
    ctx.save();
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.45)';
    ctx.lineWidth = 1.0;
    ctx.beginPath();
    ctx.arc(ballX, ballY, radius, 0, Math.PI * 2);
    ctx.stroke();

    const rimGlow = ctx.createRadialGradient(ballX, ballY, radius * 0.90, ballX, ballY, radius * 1.18);
    rimGlow.addColorStop(0.0, 'rgba(255, 255, 255, 0.16)');
    rimGlow.addColorStop(0.4, 'rgba(0, 242, 254, 0.06)');
    rimGlow.addColorStop(1.0, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = rimGlow;
    ctx.beginPath();
    ctx.arc(ballX, ballY, radius * 1.18, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    // 6. MICRO-DESTELLOS ÓPTICOS ESTELARES SUTILES (Subtle Micro Starburst Glints)
    if (starburstFlares.length > 0) {
      ctx.save();
      ctx.globalCompositeOperation = 'lighter';
      for (const flare of starburstFlares) {
        const flareSize = (6 + 6 * flare.intensity) * (1.0 + beatPulse * 0.2);
        const flareAlpha = Math.min(0.28, flare.intensity * 0.32);
        const rgb = flare.rgb;

        ctx.save();
        ctx.translate(flare.x, flare.y);
        ctx.rotate(nowSec * 1.2 + flare.intensity);

        // Estrella prismática de 4 puntas suave
        ctx.fillStyle = `rgba(255, 255, 255, ${flareAlpha.toFixed(2)})`;
        for (let arm = 0; arm < 2; arm++) {
          ctx.save();
          ctx.rotate((arm * Math.PI) / 2);
          ctx.beginPath();
          ctx.ellipse(0, 0, flareSize, flareSize * 0.12, 0, 0, Math.PI * 2);
          ctx.fill();
          ctx.restore();
        }

        // Micro halo suave
        const cGrad = ctx.createRadialGradient(0, 0, 0, 0, 0, flareSize * 0.4);
        cGrad.addColorStop(0.0, `rgba(255, 255, 255, ${flareAlpha.toFixed(2)})`);
        cGrad.addColorStop(0.5, `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${(flareAlpha * 0.5).toFixed(2)})`);
        cGrad.addColorStop(1.0, 'rgba(0, 0, 0, 0)');
        ctx.fillStyle = cGrad;
        ctx.beginPath();
        ctx.arc(0, 0, flareSize * 0.4, 0, Math.PI * 2);
        ctx.fill();

        ctx.restore();
      }
      ctx.restore();
    }

    ctx.restore();
  }

  renderTopMilestone(ctx) {
    this.render3DComboExplosion(ctx);
  }

  renderRipples(ctx) {
    if (!this.fxRipples || this.fxRipples.length === 0 || !ctx) return;
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    const len = this.fxRipples.length;
    const mult = Math.max(1, Math.min(5, this.comboMultiplier || 1));
    const now = performance.now();
    const activeBpm = this.currentBpm || (this.beatmapData && this.beatmapData.metadata ? this.beatmapData.metadata.bpm : 128) || 128;
    const bpmFreq = (now * activeBpm / 60000) * Math.PI * 2;

    for (let i = 0; i < len; i++) {
      const r = this.fxRipples[i];
      if (!r || r.alpha <= 0.01) continue;
      const alpha = Math.max(0, Math.min(1, r.alpha));
      const col = r.color || '#00f2fe';
      const rad = Math.max(1, r.radius);
      const maxR = Math.max(10, r.maxRadius || 200);
      const progress = Math.min(1, rad / maxR);
      const widthFactor = 1 - progress;

      // Geometría sinusoidal eléctrica (borde eléctrico con ondulación según BPM y combo)
      const steps = 38;
      const waveFreq = 6 + mult * 2.2;
      const waveAmp = (3.0 + mult * 2.0) * Math.sin(progress * Math.PI) * (0.65 + 0.35 * Math.sin(bpmFreq));

      // 1. Halo de energía exterior sinusoidal eléctrico
      ctx.strokeStyle = hexToRgba(col, alpha * 0.85);
      ctx.lineWidth = Math.max(2.0, 5.5 * widthFactor);
      ctx.beginPath();
      for (let s = 0; s <= steps; s++) {
        const theta = (s / steps) * Math.PI * 2;
        const offset = Math.sin(theta * waveFreq + now * 0.016) * waveAmp;
        const curR = Math.max(1, rad + offset);
        const px = r.x + Math.cos(theta) * curR;
        const py = r.y + Math.sin(theta) * curR * 0.75;
        if (s === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      }
      ctx.closePath();
      ctx.stroke();

      // 2. Núcleo blanco incandescente de alta intensidad
      ctx.strokeStyle = `rgba(255, 255, 255, ${(alpha * 0.95).toFixed(3)})`;
      ctx.lineWidth = Math.max(1.0, 2.2 * widthFactor);
      ctx.beginPath();
      for (let s = 0; s <= steps; s++) {
        const theta = (s / steps) * Math.PI * 2;
        const offset = Math.sin(theta * waveFreq + now * 0.016 + 0.4) * (waveAmp * 0.7);
        const curR = Math.max(1, rad - 1.2 + offset);
        const px = r.x + Math.cos(theta) * curR;
        const py = r.y + Math.sin(theta) * curR * 0.75;
        if (s === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      }
      ctx.closePath();
      ctx.stroke();
    }
    ctx.restore();
  }

  renderMusicalNotes() {
    if (!this.musicalNotes || this.musicalNotes.length === 0) return;
    const ctx = this.ctx;
    ctx.save();
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    for (let i = 0; i < this.musicalNotes.length; i++) {
      const mn = this.musicalNotes[i];
      if (!mn || mn.alpha <= 0.01) continue;
      ctx.save();
      ctx.globalAlpha = Math.max(0, Math.min(1, mn.alpha));
      ctx.translate(mn.x, mn.y);
      ctx.rotate(mn.rot);
      ctx.scale(mn.scale, mn.scale);

      ctx.font = 'bold 22px "Cinzel", serif';
      ctx.shadowBlur = 0;
      ctx.fillStyle = mn.color || '#ffd700';
      ctx.fillText(mn.symbol, 0, 0);

      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 18px "Cinzel", serif';
      ctx.fillText(mn.symbol, 0, 0);
      ctx.restore();
    }
    ctx.restore();
  }

  // =========================================================================
  // PSEUDO-3D CONICAL ENGINE (BEATSTAR PERSPECTIVE)
  // =========================================================================

  getPerspectiveCoord(lane, p) {
    // p: 0.0 at horizon, 1.0 at hit line (y = hitLineY)
    const pClamped = Math.max(-0.25, Math.min(1.4, p));
    const pCurved = pClamped >= 0 ? Math.pow(pClamped, 1.7) : -Math.pow(-pClamped, 1.7);
    const hitY = Number.isFinite(this.hitLineY) ? this.hitLineY : (this.height * 0.84);
    const horizonY = 12; // Top vanishing horizon margin
    const y = horizonY + (hitY - horizonY) * pCurved;

    // Pista Beatstar al 94% del ancho de la pantalla (elimina huecos laterales)
    const totalBaseW = this.width * 0.94;
    const baseLaneW = totalBaseW / 3;
    const scale = 0.50 + 0.50 * pCurved;
    const laneW = baseLaneW * scale;
    const midX = this.width / 2;
    // Lane 0: left (midX - laneW), Lane 1: center (midX), Lane 2: right (midX + laneW)
    const x = midX + (lane - 1) * laneW;

    return { x, y, scale, laneW, pCurved };
  }

  getLaneBoundaryX(lineIdx, yTarget) {
    const hitY = Number.isFinite(this.hitLineY) ? this.hitLineY : (this.height * 0.84);
    const horizonY = 12;
    const midX = this.width / 2;
    const totalBaseW = this.width * 0.94;
    const baseLaneW = totalBaseW / 3;
    // Interpolación cónica exacta a lo largo de las guías de la pista:
    const t = (yTarget - horizonY) / (hitY - horizonY);
    const scale = 0.50 + 0.50 * t;
    const laneW = baseLaneW * scale;
    return midX + (lineIdx - 1.5) * laneW;
  }

  drawIvoryKey(ctx, laneOrCx, cy, h, scale = 1.0, isPressed = false, isLarge = true, isSwipe = false) {
    ctx.save();

    let lane = 0;
    if (typeof laneOrCx === 'number') {
      if (laneOrCx <= 2) {
        lane = Math.max(0, Math.min(2, Math.round(laneOrCx)));
      } else {
        const laneW = this.width / 3;
        lane = Math.max(0, Math.min(2, Math.floor(laneOrCx / laneW)));
      }
    }

    const depressOffset = isPressed ? (3.5 * scale) : 0;
    const y = cy + depressOffset;
    const y0 = y - h / 2;
    const y1 = y0 + h;

    const margin = Math.max(3.0, (isLarge ? 5.0 : 3.5) * scale);

    const x0Top = this.getLaneBoundaryX(lane, y0) + margin;
    const x1Top = this.getLaneBoundaryX(lane + 1, y0) - margin;
    const x0Bot = this.getLaneBoundaryX(lane, y1) + margin;
    const x1Bot = this.getLaneBoundaryX(lane + 1, y1) - margin;

    const r = Math.max(4, (isLarge ? 10 : 6) * scale);

    const tracePerspectiveQuad = (x0T, x1T, x0B, x1B, topY, botY, rad) => {
      const cr = Math.min(rad, (botY - topY) * 0.35, (x1T - x0T) * 0.30);
      ctx.beginPath();
      ctx.moveTo((x0T + x1T) / 2, topY);
      ctx.arcTo(x1T, topY, x1B, botY, cr);
      ctx.arcTo(x1B, botY, x0B, botY, cr);
      ctx.arcTo(x0B, botY, x0T, topY, cr);
      ctx.arcTo(x0T, topY, x1T, topY, cr);
      ctx.closePath();
    };

    // Paleta y color neón de la nota
    const palette = this.activeSongPalette || (typeof SONG_COLOR_PALETTES !== 'undefined' ? SONG_COLOR_PALETTES.classic : { primary: '#ff00aa', secondary: '#ffffff', glow: '#ff00aa' });
    const glowColor = palette ? (palette.glow || palette.primary) : '#ff00aa';

    const cx = (x0Top + x1Top + x0Bot + x1Bot) / 4;
    const cyMid = (y0 + y1) / 2;
    const keyW = x1Bot - x0Bot;
    const keyH = y1 - y0;

    // 0. HALO AMBIENTAL NEÓN EXTERIOR (Estilo Beatstar auténtico: resplandor vibrante proyectado en la pista)
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    const haloMargin = (isLarge ? 12 : 8) * scale;
    const hx0T = x0Top - haloMargin;
    const hx1T = x1Top + haloMargin;
    const hx0B = x0Bot - haloMargin;
    const hx1B = x1Bot + haloMargin;
    const hy0 = y0 - haloMargin * 0.7;
    const hy1 = y1 + haloMargin * 0.9;
    const haloRad = r + 6;

    const outerGlowGrad = ctx.createRadialGradient(cx, cyMid, 4 * scale, cx, cyMid, Math.max(keyW, keyH) * 0.82);
    outerGlowGrad.addColorStop(0.0, hexToRgba(glowColor, isPressed ? 0.65 : 0.38));
    outerGlowGrad.addColorStop(0.40, hexToRgba(glowColor, isPressed ? 0.35 : 0.18));
    outerGlowGrad.addColorStop(1.0, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = outerGlowGrad;
    tracePerspectiveQuad(hx0T, hx1T, hx0B, hx1B, hy0, hy1, haloRad);
    ctx.fill();
    ctx.restore();

    // 1. Sombra de contacto suave proyectada sobre la pista clara de escenario
    ctx.fillStyle = isPressed ? 'rgba(0, 0, 0, 0.25)' : 'rgba(0, 0, 0, 0.42)';
    const shadowOff = (isLarge ? 6.0 : 3.2) * scale;
    tracePerspectiveQuad(x0Top, x1Top, x0Bot, x1Bot, y0 + shadowOff, y1 + shadowOff, r);
    ctx.fill();

    // 2. Cara Frontal en grosor 3D negro mate (#141419)
    const bevelH = Math.max(3, (isLarge ? 9 : 5) * scale);
    const yBevelTop = y1 - bevelH;
    const x0Bev = this.getLaneBoundaryX(lane, yBevelTop) + margin;
    const x1Bev = this.getLaneBoundaryX(lane + 1, yBevelTop) - margin;

    const bevelGrad = ctx.createLinearGradient(0, yBevelTop, 0, y1);
    bevelGrad.addColorStop(0.0, isPressed ? '#22222a' : '#181820');
    bevelGrad.addColorStop(1.0, isPressed ? '#141419' : '#141419');
    ctx.fillStyle = bevelGrad;
    tracePerspectiveQuad(x0Bev, x1Bev, x0Bot, x1Bot, yBevelTop, y1, r);
    ctx.fill();

    // 3. Cara Superior en negro obsidiana pulido (Glossy Black) con degradado reflectante (#363645 a #0e0e13)
    const topGrad = ctx.createLinearGradient(0, y0, 0, yBevelTop);
    if (isPressed) {
      topGrad.addColorStop(0.0, '#ffffff');
      topGrad.addColorStop(0.20, '#50ffb0');
      topGrad.addColorStop(1.0, '#121218');
    } else {
      topGrad.addColorStop(0.0, '#363645'); // Borde cenital reflectante
      topGrad.addColorStop(0.25, '#22222d');
      topGrad.addColorStop(0.65, '#16161e');
      topGrad.addColorStop(1.0, '#0e0e13'); // Negro obsidiana pulido profundo
    }

    ctx.fillStyle = topGrad;
    tracePerspectiveQuad(x0Top, x1Top, x0Bev, x1Bev, y0, yBevelTop, r);
    ctx.fill();

    // 4. Borde metálico (#4e4e60)
    ctx.save();
    ctx.strokeStyle = isPressed ? '#ffffff' : '#4e4e60';
    ctx.lineWidth = Math.max(1.1, (isPressed ? 2.0 : 1.5) * scale);
    tracePerspectiveQuad(x0Top, x1Top, x0Bot, x1Bot, y0, y1, r);
    ctx.stroke();

    // Destello de bisel reflectante superior
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.45)';
    ctx.lineWidth = Math.max(0.8, 1.2 * scale);
    ctx.beginPath();
    ctx.moveTo(x0Top + r, y0 + 0.8);
    ctx.lineTo(x1Top - r, y0 + 0.8);
    ctx.stroke();
    ctx.restore();

    // 5. Hendidura de Luz Central: Cápsula biselada con luz blanca/fucsia incandescente (#ffffff con shadowBlur: 12)
    if (!isSwipe) {
      const slitW = keyW * 0.62;
      const slitH = Math.max(4.5, 7.0 * scale);
      const slitX = cx - slitW / 2;
      const slitY = cyMid - slitH / 2;

      // Base biselada hundida en negro
      ctx.save();
      ctx.fillStyle = '#000000';
      if (ctx.roundRect) ctx.roundRect(slitX - 1, slitY - 1, slitW + 2, slitH + 2, slitH / 2);
      else ctx.rect(slitX - 1, slitY - 1, slitW + 2, slitH + 2);
      ctx.fill();

      // Luz incandescente blanca con shadowBlur: 12
      ctx.shadowColor = '#ffffff';
      ctx.shadowBlur = 12 * scale;
      ctx.fillStyle = '#ffffff';
      if (ctx.roundRect) ctx.roundRect(slitX, slitY, slitW, slitH, slitH / 2);
      else ctx.rect(slitX, slitY, slitW, slitH);
      ctx.fill();

      // Núcleo central de alta energía
      ctx.globalCompositeOperation = 'lighter';
      ctx.fillStyle = glowColor;
      const coreW = slitW * 0.45;
      const coreH = Math.max(2.0, slitH * 0.45);
      if (ctx.roundRect) ctx.roundRect(cx - coreW / 2, cyMid - coreH / 2, coreW, coreH, coreH / 2);
      else ctx.rect(cx - coreW / 2, cyMid - coreH / 2, coreW, coreH);
      ctx.fill();
      ctx.restore();
    }

    ctx.restore();
    return { cx, cy: cyMid, w: keyW, h: keyH };
  }

  // Tecla Neón 2D Clásica (para modo 2D Neón)
  draw2DNeonKey(ctx, cx, cy, w, h, isPressed = false, isLarge = true) {
    ctx.save();
    const x0 = cx - w / 2;
    const y0 = cy - h / 2;
    const r = isLarge ? 8 : 5;

    ctx.shadowBlur = 0;

    const grad = ctx.createLinearGradient(0, y0, 0, y0 + h);
    if (isPressed) {
      grad.addColorStop(0.0, '#ffffff');
      grad.addColorStop(0.3, '#ff007f');
      grad.addColorStop(0.8, '#aa0055');
      grad.addColorStop(1.0, '#550022');
    } else {
      grad.addColorStop(0.0, '#ffffff');
      grad.addColorStop(0.15, '#e0fcff');
      grad.addColorStop(0.5, '#00d2fe');
      grad.addColorStop(0.85, '#005588');
      grad.addColorStop(1.0, '#002244');
    }
    ctx.fillStyle = grad;
    ctx.beginPath();
    if (ctx.roundRect) ctx.roundRect(x0, y0, w, h, r);
    else ctx.rect(x0, y0, w, h);
    ctx.fill();

    ctx.strokeStyle = isPressed ? '#ffffff' : 'rgba(255, 255, 255, 0.9)';
    ctx.lineWidth = isLarge ? 2.2 : 1.4;
    ctx.stroke();

    // Línea de energía central para teclas grandes en 2D
    if (isLarge) {
      ctx.fillStyle = isPressed ? 'rgba(255, 255, 255, 0.9)' : 'rgba(0, 242, 254, 0.85)';
      ctx.fillRect(cx - (w * 0.48) / 2, cy - 1.5, w * 0.48, 3);
    }

    ctx.restore();
  }

  renderLanes(currentTime = null) {
    const ctx = this.ctx;
    const cTime = Number.isFinite(currentTime) ? currentTime : (this.getCurrentGameTimeMs() || 0);
    const hitY = Number.isFinite(this.hitLineY) ? this.hitLineY : (this.height * 0.84);
    const horizonY = 12;
    const bottomY = this.height + 30;
    const midX = this.width / 2;
    const is3D = (this.visualDimension !== '2d');

    // Cálculo exacto del pulso Beatstar sincronizado al BPM de la canción
    const songBpm = (this.beatmapData && this.beatmapData.bpm) ? Math.max(40, this.beatmapData.bpm) : 128;
    const beatInterval = 60 / songBpm;
    const audioTime = Math.max(0, cTime) / 1000;
    const beatFraction = ((audioTime % beatInterval) + beatInterval) % beatInterval / beatInterval;
    const beatPulse = Math.pow(Math.max(0, 1 - beatFraction), 2.8); // Pico explosivo en el bombo

    // Multiplicador activo y color temático
    const mult = this.multiplier || 1;
    const palette = this.activeSongPalette || (typeof SONG_COLOR_PALETTES !== 'undefined' ? SONG_COLOR_PALETTES.classic : null);
    let railLaserCol = palette ? (palette.primary || '#00f5a0') : '#00f5a0';
    let railGlowCol = palette ? (palette.glow || '#00f5a0') : '#00f5a0';

    if (mult === 2) {
      railLaserCol = '#ffd700'; // Dorado 2x
      railGlowCol = '#ffaa00';
    } else if (mult === 3) {
      railLaserCol = '#ff007f'; // Magenta Neón 3x
      railGlowCol = '#d946ef';
    } else if (mult === 4) {
      railLaserCol = '#00f2fe'; // Cian Eléctrico 4x
      railGlowCol = '#38bdf8';
    } else if (mult >= 5) {
      railLaserCol = '#ffffff'; // Fiebre Diamante 5x
      railGlowCol = '#ffd700';
    }

    // Actualizar portal del artista al compás del BPM
    if (!this.hudArtistPortalEl) this.hudArtistPortalEl = document.getElementById('hudArtistPortal');
    if (this.hudArtistPortalEl) {
      this.hudArtistPortalEl.style.transform = `scale(${(1 + beatPulse * 0.12).toFixed(3)})`;
    }

    ctx.save();

    if (is3D) {
      const getBoundaryX = (lineIdx, yTarget) => this.getLaneBoundaryX(lineIdx, yTarget);

      // 1. PISTA RETROILUMINADA CON PROFUNDIDAD INFINITA (Infinite 3D Highway with Horizon Vanishing Point)
      const tL_top = getBoundaryX(0, horizonY);
      const tR_top = getBoundaryX(3, horizonY);
      const tR_bot = getBoundaryX(3, bottomY);
      const tL_bot = getBoundaryX(0, bottomY);

      // A. Suelo principal de la pista con degradado de perspectiva atmosférica infinita
      const trackGrad = ctx.createLinearGradient(midX, horizonY, midX, bottomY);
      trackGrad.addColorStop(0.0, 'rgba(12, 16, 26, 0.20)'); // Fundido infinito hacia el horizonte
      trackGrad.addColorStop(0.12, 'rgba(40, 58, 72, 0.55)');
      trackGrad.addColorStop(0.30, 'rgba(92, 122, 138, 0.80)');
      trackGrad.addColorStop(0.60, '#bdd7de');
      trackGrad.addColorStop(0.85, '#eef6f8');
      trackGrad.addColorStop(1.0, '#ffffff'); // Blanco puro reflectante ultra nítido en el receptor

      ctx.beginPath();
      ctx.moveTo(tL_top, horizonY);
      ctx.lineTo(tR_top, horizonY);
      ctx.lineTo(tR_bot, bottomY);
      ctx.lineTo(tL_bot, bottomY);
      ctx.closePath();
      ctx.fillStyle = trackGrad;
      ctx.fill();

      // B. Peldaños de cuadrícula en perspectiva hiperbólica hacia el infinito (Perspective Depth Rungs)
      const numRungs = 24;
      for (let r = 1; r < numRungs; r++) {
        const pNorm = r / numRungs;
        const p = Math.pow(pNorm, 2.3); // Progresión de perspectiva geométrica
        const ry = horizonY + (bottomY - horizonY) * p;
        const rxL = getBoundaryX(0, ry);
        const rxR = getBoundaryX(3, ry);
        const rungAlpha = Math.min(0.24, 0.04 + 0.28 * p);
        ctx.strokeStyle = `rgba(255, 255, 255, ${rungAlpha.toFixed(3)})`;
        ctx.lineWidth = Math.max(0.8, 2.2 * p);
        ctx.beginPath();
        ctx.moveTo(rxL, ry);
        ctx.lineTo(rxR, ry);
        ctx.stroke();
      }

      // C. Reflejo especular satinado central (escenario Beatstar de cristal)
      ctx.save();
      ctx.globalCompositeOperation = 'overlay';
      const glossGrad = ctx.createLinearGradient(midX - 140, 0, midX + 140, 0);
      glossGrad.addColorStop(0.0, 'rgba(255, 255, 255, 0)');
      glossGrad.addColorStop(0.5, 'rgba(255, 255, 255, 0.42)');
      glossGrad.addColorStop(1.0, 'rgba(255, 255, 255, 0)');
      ctx.fillStyle = glossGrad;
      ctx.fillRect(tL_top - 20, horizonY, (tR_bot - tL_bot) + 40, bottomY - horizonY);
      ctx.restore();

      // D. Núcleo estelar luminoso en el punto de fuga del horizonte (Vanishing Point Horizon Glow)
      ctx.save();
      ctx.globalCompositeOperation = 'lighter';
      const vanishGrad = ctx.createRadialGradient(midX, horizonY, 2, midX, horizonY, 70);
      vanishGrad.addColorStop(0.0, 'rgba(255, 255, 255, 0.90)');
      vanishGrad.addColorStop(0.35, hexToRgba(railLaserCol, 0.45));
      vanishGrad.addColorStop(1.0, 'rgba(0, 0, 0, 0)');
      ctx.fillStyle = vanishGrad;
      ctx.beginPath();
      ctx.arc(midX, horizonY, 70, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();

      // Líneas divisorias de carriles: Cromo satinado oscuro de alto contraste
      for (let l = 1; l <= 2; l++) {
        const xT = getBoundaryX(l, horizonY);
        const xB = getBoundaryX(l, bottomY);
        ctx.save();
        const divGrad = ctx.createLinearGradient(0, horizonY, 0, bottomY);
        divGrad.addColorStop(0.0, 'rgba(90, 110, 115, 0.35)');
        divGrad.addColorStop(0.6, 'rgba(70, 88, 94, 0.65)');
        divGrad.addColorStop(1.0, 'rgba(50, 68, 75, 0.85)');
        ctx.strokeStyle = divGrad;
        ctx.lineWidth = 1.8;
        ctx.beginPath();
        ctx.moveTo(xT, horizonY);
        ctx.lineTo(xB, bottomY);
        ctx.stroke();
        ctx.restore();
      }

      // 2. COLUMNAS DE LUZ VOLUMÉTRICAS DE CARRIL (Lane Flood Aditivo en Acierto & Holds)
      for (let l = 0; l < 3; l++) {
        const flashTimer = (Array.isArray(this.laneFlashTimers) && this.laneFlashTimers[l]) || 0;
        const isHolding = this.activeHolds.has(l);
        const glow = this.laneGlows[l] || 0;

        if (isHolding || flashTimer > 0 || glow > 0.04) {
          ctx.save();
          ctx.globalCompositeOperation = 'lighter';
          const pL_top = getBoundaryX(l, horizonY);
          const pR_top = getBoundaryX(l + 1, horizonY);
          const pL_bot = getBoundaryX(l, hitY + 32);
          const pR_bot = getBoundaryX(l + 1, hitY + 32);
          const midTopX = (pL_top + pR_top) / 2;
          const midBotX = (pL_bot + pR_bot) / 2;

          const flashCol = (Array.isArray(this.laneFlashColors) && this.laneFlashColors[l]) || railLaserCol;
          const rgb = hexToRgb(flashCol);
          let baseAlpha = isHolding ? 0.72 : (flashTimer > 0 ? (0.75 * Math.min(1.0, flashTimer / 0.16)) : Math.min(0.60, glow * 0.60));

          // A. Trapezoidal Flood de suelo completo (Horizonte a Receptor)
          const laneGrad = ctx.createLinearGradient(0, hitY + 32, 0, horizonY);
          laneGrad.addColorStop(0.0, `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${baseAlpha.toFixed(3)})`);
          laneGrad.addColorStop(0.35, `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${(baseAlpha * 0.65).toFixed(3)})`);
          laneGrad.addColorStop(0.75, `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${(baseAlpha * 0.25).toFixed(3)})`);
          laneGrad.addColorStop(1.0, `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0)`);

          ctx.beginPath();
          ctx.moveTo(pL_top, horizonY);
          ctx.lineTo(pR_top, horizonY);
          ctx.lineTo(pR_bot, hitY + 32);
          ctx.lineTo(pL_bot, hitY + 32);
          ctx.closePath();
          ctx.fillStyle = laneGrad;
          ctx.fill();

          // B. Haz central incandescente de alta concentración (Columna Láser de Núcleo Blanco)
          const coreGrad = ctx.createLinearGradient(0, hitY + 32, 0, horizonY);
          coreGrad.addColorStop(0.0, `rgba(255, 255, 255, ${(baseAlpha * 0.90).toFixed(3)})`);
          coreGrad.addColorStop(0.50, `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${(baseAlpha * 0.45).toFixed(3)})`);
          coreGrad.addColorStop(1.0, `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0)`);

          const coreW_top = Math.max(4, (pR_top - pL_top) * 0.25);
          const coreW_bot = Math.max(12, (pR_bot - pL_bot) * 0.35);

          ctx.beginPath();
          ctx.moveTo(midTopX - coreW_top / 2, horizonY);
          ctx.lineTo(midTopX + coreW_top / 2, horizonY);
          ctx.lineTo(midBotX + coreW_bot / 2, hitY + 32);
          ctx.lineTo(midBotX - coreW_bot / 2, hitY + 32);
          ctx.closePath();
          ctx.fillStyle = coreGrad;
          ctx.fill();

          // C. Reflejos en los raíles separadores izquierdo y derecho
          ctx.strokeStyle = `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${(baseAlpha * 0.80).toFixed(3)})`;
          ctx.lineWidth = 2.8;
          ctx.beginPath();
          ctx.moveTo(pL_top, horizonY);
          ctx.lineTo(pL_bot, hitY + 32);
          ctx.moveTo(pR_top, horizonY);
          ctx.lineTo(pR_bot, hitY + 32);
          ctx.stroke();

          // D. Impacto radial en la zona de contacto
          const impactGrad = ctx.createRadialGradient(midBotX, hitY, 4, midBotX, hitY, (pR_bot - pL_bot) * 0.85);
          impactGrad.addColorStop(0.0, `rgba(255, 255, 255, ${(baseAlpha * 0.95).toFixed(3)})`);
          impactGrad.addColorStop(0.40, `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${(baseAlpha * 0.60).toFixed(3)})`);
          impactGrad.addColorStop(1.0, 'rgba(0, 0, 0, 0)');
          ctx.fillStyle = impactGrad;
          ctx.beginPath();
          ctx.arc(midBotX, hitY, (pR_bot - pL_bot) * 0.85, 0, Math.PI * 2);
          ctx.fill();

          ctx.restore();
        }
      }

      // 3. CHASIS METÁLICO CONTINUO Y ALAS LATERALES (Estilo Beatstar Cyber-Metallic Chassis)
      const wingMaxWidth = this.width * 0.16;

      // Alas sólidas laterales en degradado titanio/obsidiana satinado
      ctx.save();
      const leftWingGrad = ctx.createLinearGradient(Math.max(0, tL_bot - wingMaxWidth), 0, tL_bot, 0);
      leftWingGrad.addColorStop(0.0, '#0a0d14');
      leftWingGrad.addColorStop(0.5, '#151c27');
      leftWingGrad.addColorStop(1.0, '#222d3d');

      ctx.fillStyle = leftWingGrad;
      ctx.beginPath();
      ctx.moveTo(tL_top, horizonY);
      ctx.lineTo(Math.max(0, tL_top - 14), horizonY);
      ctx.lineTo(Math.max(0, tL_bot - wingMaxWidth), bottomY);
      ctx.lineTo(tL_bot, bottomY);
      ctx.closePath();
      ctx.fill();

      // Borde exterior biselado de cromo (Ala Izquierda)
      ctx.strokeStyle = 'rgba(110, 136, 160, 0.45)';
      ctx.lineWidth = 2.0;
      ctx.beginPath();
      ctx.moveTo(Math.max(0, tL_top - 14), horizonY);
      ctx.lineTo(Math.max(0, tL_bot - wingMaxWidth), bottomY);
      ctx.stroke();

      const rightWingGrad = ctx.createLinearGradient(tR_bot, 0, Math.min(this.width, tR_bot + wingMaxWidth), 0);
      rightWingGrad.addColorStop(0.0, '#222d3d');
      rightWingGrad.addColorStop(0.5, '#151c27');
      rightWingGrad.addColorStop(1.0, '#0a0d14');

      ctx.fillStyle = rightWingGrad;
      ctx.beginPath();
      ctx.moveTo(tR_top, horizonY);
      ctx.lineTo(Math.min(this.width, tR_top + 14), horizonY);
      ctx.lineTo(Math.min(this.width, tR_bot + wingMaxWidth), bottomY);
      ctx.lineTo(tR_bot, bottomY);
      ctx.closePath();
      ctx.fill();

      // Borde exterior biselado de cromo (Ala Derecha)
      ctx.strokeStyle = 'rgba(110, 136, 160, 0.45)';
      ctx.lineWidth = 2.0;
      ctx.beginPath();
      ctx.moveTo(Math.min(this.width, tR_top + 14), horizonY);
      ctx.lineTo(Math.min(this.width, tR_bot + wingMaxWidth), bottomY);
      ctx.stroke();
      ctx.restore();

      // 4. BARITAS DE RITMO DE BORDES CON ACABADO REDONDEADO Y DEGRADADO VIBRANTE
      const numLines = 36;
      const bpmSpeed = (songBpm / 60) * Math.PI * 2;

      ctx.save();
      ctx.globalCompositeOperation = 'lighter';
      ctx.lineCap = 'round'; // Acabado redondeado impecable

      for (let s = 0; s < numLines; s++) {
        const pNorm = s / (numLines - 1);
        const p = Math.pow(pNorm, 1.25);
        const yCenter = horizonY + (bottomY - horizonY) * p;

        // Onda senoidal viajera a lo largo de la pista según el compás de la música (BPM)
        const wavePhase = p * 14.0 - audioTime * bpmSpeed;
        const sineVal = 0.5 + 0.5 * Math.sin(wavePhase);

        // Longitud proyectada recta en perspectiva
        const baseLength = 14 + 52 * p;
        const ribLength = baseLength * (0.32 + 0.68 * sineVal) * (1.0 + beatPulse * 0.35);

        // Grosor proporcional en perspectiva (cápsula redondeada más gruesa en primer plano)
        const lineThick = Math.max(3.0, (3.2 + 6.0 * p) * (1.0 + beatPulse * 0.30));
        const lineAlpha = Math.min(1.0, 0.35 + (beatPulse * 0.40) + (sineVal * 0.45));

        // --- LADO IZQUIERDO (Degradado desde el raíl hacia la punta exterior redondeada) ---
        const xL_in = getBoundaryX(0, yCenter) - 2;
        const xL_out = xL_in - ribLength;

        const gradLeft = ctx.createLinearGradient(xL_in, yCenter, xL_out, yCenter);
        gradLeft.addColorStop(0.0, '#ffffff'); // Núcleo blanco brillante en la unión con el raíl
        gradLeft.addColorStop(0.25, hexToRgba(railLaserCol, lineAlpha));
        gradLeft.addColorStop(0.75, hexToRgba(railGlowCol, lineAlpha * 0.70));
        gradLeft.addColorStop(1.0, hexToRgba(railGlowCol, 0.0)); // Desvanecimiento suave en la punta

        ctx.strokeStyle = gradLeft;
        ctx.lineWidth = lineThick;
        ctx.beginPath();
        ctx.moveTo(xL_in, yCenter);
        ctx.lineTo(xL_out, yCenter);
        ctx.stroke();

        // Núcleo blanco brillante redondeado interior
        if (sineVal > 0.55 || beatPulse > 0.35) {
          ctx.strokeStyle = hexToRgba('#ffffff', lineAlpha * 0.80);
          ctx.lineWidth = Math.max(1.5, lineThick * 0.45);
          ctx.beginPath();
          ctx.moveTo(xL_in, yCenter);
          ctx.lineTo(xL_in - ribLength * 0.45, yCenter);
          ctx.stroke();
        }

        // --- LADO DERECHO (Degradado desde el raíl hacia la punta exterior redondeada) ---
        const xR_in = getBoundaryX(3, yCenter) + 2;
        const xR_out = xR_in + ribLength;

        const gradRight = ctx.createLinearGradient(xR_in, yCenter, xR_out, yCenter);
        gradRight.addColorStop(0.0, '#ffffff');
        gradRight.addColorStop(0.25, hexToRgba(railLaserCol, lineAlpha));
        gradRight.addColorStop(0.75, hexToRgba(railGlowCol, lineAlpha * 0.70));
        gradRight.addColorStop(1.0, hexToRgba(railGlowCol, 0.0));

        ctx.strokeStyle = gradRight;
        ctx.lineWidth = lineThick;
        ctx.beginPath();
        ctx.moveTo(xR_in, yCenter);
        ctx.lineTo(xR_out, yCenter);
        ctx.stroke();

        if (sineVal > 0.55 || beatPulse > 0.35) {
          ctx.strokeStyle = hexToRgba('#ffffff', lineAlpha * 0.80);
          ctx.lineWidth = Math.max(1.5, lineThick * 0.45);
          ctx.beginPath();
          ctx.moveTo(xR_in, yCenter);
          ctx.lineTo(xR_in + ribLength * 0.45, yCenter);
          ctx.stroke();
        }
      }

      ctx.restore();

      // 5. GUÍAS LÁSER DE NEÓN CONTINUAS DE ALTA INTENSIDAD (Estilo Beatstar Pure Laser Guides)
      ctx.save();
      ctx.globalCompositeOperation = 'lighter';

      // Resplandor difuso exterior
      ctx.strokeStyle = hexToRgba(railLaserCol, 0.55 + beatPulse * 0.35);
      ctx.lineWidth = 6.5;
      ctx.beginPath();
      ctx.moveTo(tL_top, horizonY);
      ctx.lineTo(tL_bot, bottomY);
      ctx.moveTo(tR_top, horizonY);
      ctx.lineTo(tR_bot, bottomY);
      ctx.stroke();

      // Núcleo blanco incandescente
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 2.2;
      ctx.beginPath();
      ctx.moveTo(tL_top, horizonY);
      ctx.lineTo(tL_bot, bottomY);
      ctx.moveTo(tR_top, horizonY);
      ctx.lineTo(tR_bot, bottomY);
      ctx.stroke();

      // 6. EFECTO BLOW LATERAL EXPANSIVO SUTIL A MEDIDA QUE SUBE EL COMBO
      const comboBlow = Math.min(1.2, (this.combo || 0) / 60);
      if (comboBlow > 0.1) {
        // Halo de resplandor blow lateral izquierdo sutil fuera de la pista
        const blowGradL = ctx.createRadialGradient(tL_bot, hitY, 10, tL_bot, hitY, 90 * comboBlow);
        blowGradL.addColorStop(0.0, hexToRgba(railLaserCol, 0.20 * comboBlow));
        blowGradL.addColorStop(0.6, hexToRgba(railGlowCol, 0.08 * comboBlow));
        blowGradL.addColorStop(1.0, 'rgba(0,0,0,0)');
        ctx.fillStyle = blowGradL;
        ctx.beginPath();
        ctx.arc(tL_bot, hitY, 90 * comboBlow, 0, Math.PI * 2);
        ctx.fill();

        // Halo de resplandor blow lateral derecho sutil fuera de la pista
        const blowGradR = ctx.createRadialGradient(tR_bot, hitY, 10, tR_bot, hitY, 90 * comboBlow);
        blowGradR.addColorStop(0.0, hexToRgba(railLaserCol, 0.20 * comboBlow));
        blowGradR.addColorStop(0.6, hexToRgba(railGlowCol, 0.08 * comboBlow));
        blowGradR.addColorStop(1.0, 'rgba(0,0,0,0)');
        ctx.fillStyle = blowGradR;
        ctx.beginPath();
        ctx.arc(tR_bot, hitY, 90 * comboBlow, 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.restore();

    } else {
      // ==========================================
      // 2D NEÓN CLÁSICO (Modo Plano)
      // ==========================================
      const laneW = this.width / 3;

      ctx.fillStyle = 'rgba(8, 6, 14, 0.88)';
      ctx.fillRect(0, 0, this.width, this.height);

      for (let l = 1; l <= 2; l++) {
        const lx = l * laneW;
        ctx.save();
        ctx.strokeStyle = 'rgba(197, 160, 89, 0.35)';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(lx, 0);
        ctx.lineTo(lx, this.height);
        ctx.stroke();
        ctx.restore();
      }

      for (let l = 0; l < 3; l++) {
        const isHolding = this.activeHolds.has(l);
        const flashTimer = (Array.isArray(this.laneFlashTimers) && this.laneFlashTimers[l]) || 0;
        const glow = this.laneGlows[l] || 0;
        if (isHolding || flashTimer > 0.001 || glow > 0.01) {
          ctx.save();
          ctx.globalCompositeOperation = 'lighter';
          const neonGrad = ctx.createLinearGradient(0, hitY, 0, 0);
          let alpha = 0;
          if (isHolding) {
            alpha = 0.35;
          } else if (flashTimer > 0) {
            const p = flashTimer / 0.11;
            alpha = 0.35 * Math.sin(Math.min(1, Math.max(0, p)) * Math.PI * 0.5);
          } else {
            alpha = Math.min(0.35, glow * 0.35);
          }
          const flashCol = (Array.isArray(this.laneFlashColors) && this.laneFlashColors[l]) || '#00f2fe';
          const rgb = hexToRgb(flashCol);
          neonGrad.addColorStop(0.0, `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${alpha.toFixed(3)})`);
          neonGrad.addColorStop(0.6, `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${(alpha * 0.35).toFixed(3)})`);
          neonGrad.addColorStop(1.0, `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0)`);
          ctx.fillStyle = neonGrad;
          ctx.fillRect(l * laneW, 0, laneW, hitY + 20);
          ctx.restore();
        }
      }

    }

    ctx.restore();
  }

  renderHitLine() {
    const ctx = this.ctx;
    const hitY = Number.isFinite(this.hitLineY) ? this.hitLineY : (this.height * 0.84);
    const W = this.width;
    const is3D = (this.visualDimension !== '2d');
    const isLarge = (this.keyStyle !== 'compact');

    ctx.save();

    if (is3D) {
      const palette = this.activeSongPalette || (typeof SONG_COLOR_PALETTES !== 'undefined' ? SONG_COLOR_PALETTES.classic : null);
      const laserCol = palette ? (palette.primary || '#00f5a0') : '#00f5a0';
      const glowCol = palette ? (palette.glow || '#ffd700') : '#ffd700';
      const laserRgb = hexToRgb(laserCol);
      const glowRgb = hexToRgb(glowCol);

      const xTrackLeft = this.getLaneBoundaryX(0, hitY) - 16;
      const xTrackRight = this.getLaneBoundaryX(3, hitY) + 16;
      const trackWidth = xTrackRight - xTrackLeft;

      // =========================================================================
      // DISEÑO MAESTRO: HUECO DE TECLADO DE PIANO 3D CON TECLA HUNDIBLE Y ZONA PERFECT+
      // =========================================================================

      const deckH = isLarge ? 64 : 38;
      const deckTopY = hitY - (deckH * 0.32);
      const deckBotY = deckTopY + deckH;

      // 1. CHIP / BASE DEL ESCENARIO DE FONDO BAJO LA ZONA DE IMPACTO
      ctx.save();
      const deckGrad = ctx.createLinearGradient(0, deckTopY, 0, deckBotY);
      deckGrad.addColorStop(0.0, 'rgba(6, 8, 15, 0.80)');
      deckGrad.addColorStop(0.50, 'rgba(11, 15, 26, 0.90)');
      deckGrad.addColorStop(1.0, 'rgba(4, 5, 10, 0.95)');
      ctx.fillStyle = deckGrad;
      if (ctx.roundRect) ctx.roundRect(xTrackLeft, deckTopY, trackWidth, deckH, 10);
      else ctx.rect(xTrackLeft, deckTopY, trackWidth, deckH);
      ctx.fill();

      // Borde sutil del marco del escenario
      ctx.strokeStyle = `rgba(255, 255, 255, 0.08)`;
      ctx.lineWidth = 1.0;
      if (ctx.roundRect) ctx.roundRect(xTrackLeft, deckTopY, trackWidth, deckH, 10);
      else ctx.rect(xTrackLeft, deckTopY, trackWidth, deckH);
      ctx.stroke();
      ctx.restore();

      const traceQuad = (x0T, x1T, x0B, x1B, topY, botY, rad) => {
        const cr = Math.min(rad, (botY - topY) * 0.35, (x1T - x0T) * 0.30);
        ctx.beginPath();
        ctx.moveTo((x0T + x1T) / 2, topY);
        ctx.arcTo(x1T, topY, x1B, botY, cr);
        ctx.arcTo(x1B, botY, x0B, botY, cr);
        ctx.arcTo(x0B, botY, x0T, topY, cr);
        ctx.arcTo(x0T, topY, x1T, topY, cr);
        ctx.closePath();
      };

      // 2. HUECO Y TECLA 3D HUNDIBLE POR CARRILE
      for (let l = 0; l < 3; l++) {
        const coord = this.getPerspectiveCoord(l, 1.0);
        const cx = coord.x;
        const isHolding = this.activeHolds.has(l);
        const glow = this.laneGlows[l] || 0;
        const isPressed = glow > 0.35 || isHolding;

        // FÍSICA DE HUNDIMIENTO MECÁNICO DE TECLA DE PIANO
        const elapsedPress = performance.now() - (this.lanePressAnim ? (this.lanePressAnim[l] || 0) : 0);
        const isTapping = elapsedPress >= 0 && elapsedPress < 160;
        let tapDepth = 0;
        if (isTapping) {
          const t = elapsedPress / 160;
          if (t < 0.22) {
            tapDepth = t / 0.22; // Hundimiento ultra rápido y táctil
          } else {
            const rt = (t - 0.22) / 0.78;
            tapDepth = Math.exp(-rt * 4.2) * Math.cos(rt * Math.PI * 2.0); // Rebote elástico amortiguado
          }
        }

        const maxSink = isLarge ? 9.0 : 5.0;
        const currentSink = Math.max(0, (isHolding ? maxSink * 0.95 : 0) + (isTapping ? maxSink * tapDepth : (isPressed ? maxSink * 0.75 : 0)));

        // Dimensiones del HUECO (Cavidad en la pista, un pelín más grande que la tecla)
        const socketH = isLarge ? 56 : 32;
        const socketTopY = hitY - (isLarge ? 12 : 6);
        const socketBotY = socketTopY + socketH;
        const margin = Math.max(2.5, isLarge ? 4.0 : 2.5);

        const sx0Top = this.getLaneBoundaryX(l, socketTopY) + margin;
        const sx1Top = this.getLaneBoundaryX(l + 1, socketTopY) - margin;
        const sx0Bot = this.getLaneBoundaryX(l, socketBotY) + margin;
        const sx1Bot = this.getLaneBoundaryX(l + 1, socketBotY) - margin;
        const socketRad = isLarge ? 8 : 5;

        // --- A. EL HUECO (Cavidad rebajada en la pista con bisel y sombra interior) ---
        ctx.save();
        // Fondo profundo del hueco
        const holeBaseGrad = ctx.createLinearGradient(0, socketTopY, 0, socketBotY);
        holeBaseGrad.addColorStop(0.0, '#030407');
        holeBaseGrad.addColorStop(0.5, '#060810');
        holeBaseGrad.addColorStop(1.0, '#0a0c16');
        ctx.fillStyle = holeBaseGrad;
        traceQuad(sx0Top, sx1Top, sx0Bot, sx1Bot, socketTopY, socketBotY, socketRad);
        ctx.fill();

        // Sombra de pared interior superior del hueco (genera profundidad física)
        const innerShadowH = Math.max(4, socketH * 0.28);
        const shadowGrad = ctx.createLinearGradient(0, socketTopY, 0, socketTopY + innerShadowH);
        shadowGrad.addColorStop(0.0, 'rgba(0, 0, 0, 0.95)');
        shadowGrad.addColorStop(1.0, 'rgba(0, 0, 0, 0)');
        ctx.fillStyle = shadowGrad;
        traceQuad(sx0Top, sx1Top, sx0Top + (sx0Bot - sx0Top) * 0.28, sx1Top + (sx1Bot - sx1Top) * 0.28, socketTopY, socketTopY + innerShadowH, socketRad);
        ctx.fill();

        // Borde exterior biselado del hueco
        ctx.strokeStyle = isPressed ? `rgba(${laserRgb.r}, ${laserRgb.g}, ${laserRgb.b}, 0.55)` : 'rgba(255, 255, 255, 0.12)';
        ctx.lineWidth = 1.2;
        traceQuad(sx0Top, sx1Top, sx0Bot, sx1Bot, socketTopY, socketBotY, socketRad);
        ctx.stroke();
        ctx.restore();

        // --- B. LA TECLA DE PIANO 3D QUE SE METE HACIA ADENTRO ---
        const keyClearance = 2.5; // Holgura para encajar dentro del hueco
        const kx0Top = sx0Top + keyClearance;
        const kx1Top = sx1Top - keyClearance;
        const kx0Bot = sx0Bot + keyClearance;
        const kx1Bot = sx1Bot - keyClearance;
        const keyRad = Math.max(3, socketRad - 2);

        const keyTopY = socketTopY + keyClearance + currentSink;
        const keyBotY = socketBotY - keyClearance + currentSink;
        const keyH = keyBotY - keyTopY;
        const keyMidY = (keyTopY + keyBotY) / 2;

        // Resplandor de fondo que emana del hueco al hundirse la tecla
        if (currentSink > 0.5 || isPressed) {
          ctx.save();
          ctx.globalCompositeOperation = 'lighter';
          const spillAlpha = Math.min(0.9, (currentSink / maxSink) * 0.85 + (isHolding ? 0.4 : 0));
          const spillGrad = ctx.createRadialGradient(cx, keyMidY, 4, cx, keyMidY, (kx1Bot - kx0Bot) * 0.75);
          spillGrad.addColorStop(0.0, hexToRgba(laserCol, spillAlpha * 0.8));
          spillGrad.addColorStop(0.60, hexToRgba(glowCol, spillAlpha * 0.35));
          spillGrad.addColorStop(1.0, 'rgba(0, 0, 0, 0)');
          ctx.fillStyle = spillGrad;
          traceQuad(sx0Top - 4, sx1Top + 4, sx0Bot - 4, sx1Bot + 4, socketTopY - 2, socketBotY + 4, socketRad + 3);
          ctx.fill();
          ctx.restore();
        }

        // Cara frontal / grosor 3D de la tecla al hundirse
        const bevelH = Math.max(3, (isLarge ? 7 : 4) * (1 - (currentSink / (maxSink * 1.8))));
        const yKeyBevel = keyBotY - bevelH;
        const kx0Bev = kx0Top + (kx0Bot - kx0Top) * ((yKeyBevel - keyTopY) / keyH);
        const kx1Bev = kx1Top + (kx1Bot - kx1Top) * ((yKeyBevel - keyTopY) / keyH);

        ctx.save();
        const frontGrad = ctx.createLinearGradient(0, yKeyBevel, 0, keyBotY);
        frontGrad.addColorStop(0.0, isPressed ? '#1e2436' : '#141724');
        frontGrad.addColorStop(1.0, isPressed ? '#121622' : '#0c0e16');
        ctx.fillStyle = frontGrad;
        traceQuad(kx0Bev, kx1Bev, kx0Bot, kx1Bot, yKeyBevel, keyBotY, keyRad);
        ctx.fill();

        // Superficie superior de la tecla (Obsidiana pulida estilo Piano de Cola)
        const topKeyGrad = ctx.createLinearGradient(0, keyTopY, 0, yKeyBevel);
        if (isPressed || isHolding) {
          topKeyGrad.addColorStop(0.0, '#ffffff');
          topKeyGrad.addColorStop(0.20, `rgba(${laserRgb.r}, ${laserRgb.g}, ${laserRgb.b}, 0.95)`);
          topKeyGrad.addColorStop(0.70, '#1c2438');
          topKeyGrad.addColorStop(1.0, '#101522');
        } else {
          topKeyGrad.addColorStop(0.0, '#2e3348'); // Brillo cenital del borde superior
          topKeyGrad.addColorStop(0.25, '#1e2232');
          topKeyGrad.addColorStop(0.75, '#141724');
          topKeyGrad.addColorStop(1.0, '#0e101a'); // Negro obsidiana elegante
        }
        ctx.fillStyle = topKeyGrad;
        traceQuad(kx0Top, kx1Top, kx0Bev, kx1Bev, keyTopY, yKeyBevel, keyRad);
        ctx.fill();

        // Sombra proyectada por el borde del hueco sobre la tecla hundida
        if (currentSink > 0.8) {
          const dropShadowGrad = ctx.createLinearGradient(0, keyTopY, 0, keyTopY + currentSink * 1.4);
          dropShadowGrad.addColorStop(0.0, 'rgba(0, 0, 0, 0.85)');
          dropShadowGrad.addColorStop(1.0, 'rgba(0, 0, 0, 0)');
          ctx.fillStyle = dropShadowGrad;
          traceQuad(kx0Top, kx1Top, kx0Bev, kx1Bev, keyTopY, keyTopY + currentSink * 1.4, keyRad);
          ctx.fill();
        }

        // Borde fino de precisión de la tecla
        ctx.strokeStyle = isPressed ? `rgba(255, 255, 255, 0.90)` : `rgba(255, 255, 255, 0.18)`;
        ctx.lineWidth = isPressed ? 1.5 : 1.0;
        traceQuad(kx0Top, kx1Top, kx0Bot, kx1Bot, keyTopY, keyBotY, keyRad);
        ctx.stroke();
        ctx.restore();

        // --- C. ZONA PERFECT+ DE ALTA PRECISIÓN (Fácilmente identificable) ---
        ctx.save();
        ctx.globalCompositeOperation = 'lighter';
        const perfY = hitY + currentSink;
        const keyW = kx1Bot - kx0Bot;

        // Franja micro-slot iluminada del Perfect+
        const slotW = keyW * 0.72;
        const slotH = isLarge ? 5.0 : 3.5;
        const slotGrad = ctx.createLinearGradient(cx - slotW / 2, perfY, cx + slotW / 2, perfY);
        const slotAlpha = isPressed ? 0.95 : 0.65;
        slotGrad.addColorStop(0.0, 'rgba(0, 245, 160, 0)');
        slotGrad.addColorStop(0.25, hexToRgba(laserCol, slotAlpha * 0.6));
        slotGrad.addColorStop(0.50, hexToRgba('#ffffff', slotAlpha));
        slotGrad.addColorStop(0.75, hexToRgba(laserCol, slotAlpha * 0.6));
        slotGrad.addColorStop(1.0, 'rgba(0, 245, 160, 0)');

        ctx.fillStyle = slotGrad;
        ctx.fillRect(cx - slotW / 2, perfY - slotH / 2, slotW, slotH);

        // Mira central Perfect+ (Micro-Crosshair & Diamond ✦)
        const crosshairSize = isLarge ? 6.5 : 4.5;
        ctx.strokeStyle = isPressed ? '#ffffff' : hexToRgba(laserCol, 0.90);
        ctx.lineWidth = 1.4;

        // Línea central de precisión
        ctx.beginPath();
        ctx.moveTo(cx - slotW * 0.45, perfY);
        ctx.lineTo(cx + slotW * 0.45, perfY);
        ctx.stroke();

        // Ticks de delimitación lateral [ — ✦ — ]
        const tickLen = isLarge ? 4.5 : 3.0;
        ctx.beginPath();
        ctx.moveTo(cx - slotW * 0.35, perfY - tickLen);
        ctx.lineTo(cx - slotW * 0.35, perfY + tickLen);
        ctx.moveTo(cx + slotW * 0.35, perfY - tickLen);
        ctx.lineTo(cx + slotW * 0.35, perfY + tickLen);
        ctx.stroke();

        // Diamante central Perfect+
        ctx.fillStyle = isPressed ? '#ffffff' : laserCol;
        ctx.beginPath();
        ctx.moveTo(cx, perfY - crosshairSize * 0.8);
        ctx.lineTo(cx + crosshairSize * 0.8, perfY);
        ctx.lineTo(cx, perfY + crosshairSize * 0.8);
        ctx.lineTo(cx - crosshairSize * 0.8, perfY);
        ctx.closePath();
        ctx.fill();

        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(cx, perfY, 1.4, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();

        // --- D. ANILLO DE ENERGÍA DE NOTA SOSTENIDA (HOLD ARC) ---
        if (isHolding) {
          const active = this.activeHolds.get(l);
          const startT = active.startTime;
          const endT = active.note.end_timestamp_ms || (startT + (active.note.duration_ms || 700));
          const currT = this.getCurrentGameTimeMs();
          const progress = Math.min(1.0, Math.max(0, (currT - startT) / (endT - startT)));

          ctx.save();
          ctx.globalCompositeOperation = 'lighter';
          ctx.strokeStyle = laserCol;
          ctx.lineWidth = 3.6;
          ctx.beginPath();
          ctx.arc(cx, perfY, 22, -Math.PI / 2, -Math.PI / 2 + progress * Math.PI * 2);
          ctx.stroke();

          ctx.strokeStyle = '#ffffff';
          ctx.lineWidth = 1.6;
          ctx.beginPath();
          ctx.arc(cx, perfY, 22, -Math.PI / 2, -Math.PI / 2 + progress * Math.PI * 2);
          ctx.stroke();
          ctx.restore();
        }

        // --- E. KEYBINDS EN PC FLOTANTES ---
        if (this.isPCMode) {
          const kb = this.pcKeybinds || { 0: 'd', 1: 'f', 2: 'j' };
          const keyChar = ((kb[l] || (l === 0 ? 'd' : (l === 1 ? 'f' : 'j'))).toUpperCase());
          const pillW = 26;
          const pillH = 17;
          const pillY = socketBotY + 12;
          ctx.save();
          ctx.fillStyle = isPressed ? 'rgba(255, 255, 255, 0.32)' : 'rgba(10, 12, 22, 0.80)';
          ctx.strokeStyle = isPressed ? '#ffffff' : 'rgba(255, 255, 255, 0.22)';
          ctx.lineWidth = 1.1;
          if (ctx.roundRect) ctx.roundRect(cx - pillW / 2, pillY - pillH / 2, pillW, pillH, 4.5);
          else ctx.rect(cx - pillW / 2, pillY - pillH / 2, pillW, pillH);
          ctx.fill();
          ctx.stroke();

          ctx.font = '800 11px "Outfit", system-ui, -apple-system, sans-serif';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillStyle = isPressed ? '#ffffff' : 'rgba(255, 255, 255, 0.90)';
          ctx.fillText(keyChar, cx, pillY);
          ctx.restore();
        }
      }

      // 3. LÍNEA GUÍA HOLOGRÁFICA ULTRA NÍTIDA (Precision Horizon Guideline)
      ctx.save();
      ctx.globalCompositeOperation = 'lighter';

      const guideGrad = ctx.createLinearGradient(xTrackLeft, 0, xTrackRight, 0);
      guideGrad.addColorStop(0.0, 'rgba(0, 0, 0, 0)');
      guideGrad.addColorStop(0.12, `rgba(${laserRgb.r}, ${laserRgb.g}, ${laserRgb.b}, 0.35)`);
      guideGrad.addColorStop(0.50, `rgba(255, 255, 255, 0.85)`);
      guideGrad.addColorStop(0.88, `rgba(${laserRgb.r}, ${laserRgb.g}, ${laserRgb.b}, 0.35)`);
      guideGrad.addColorStop(1.0, 'rgba(0, 0, 0, 0)');

      ctx.strokeStyle = guideGrad;
      ctx.lineWidth = 1.6;
      ctx.beginPath();
      ctx.moveTo(xTrackLeft, hitY);
      ctx.lineTo(xTrackRight, hitY);
      ctx.stroke();

      // Micro-marcas terminales elegantes
      ctx.fillStyle = laserCol;
      ctx.beginPath();
      ctx.arc(xTrackLeft + 4, hitY, 3, 0, Math.PI * 2);
      ctx.arc(xTrackRight - 4, hitY, 3, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();

    } else {
      // ==========================================
      // 2D NEÓN HIT LINE (Modo Plano)
      // ==========================================
      const laneW = this.width / 3;

      ctx.save();
      ctx.strokeStyle = '#00f2fe';
      ctx.lineWidth = 3;
      ctx.shadowBlur = 0;
      ctx.beginPath();
      ctx.moveTo(0, hitY);
      ctx.lineTo(W, hitY);
      ctx.stroke();
      ctx.restore();

      for (let l = 0; l < 3; l++) {
        const cx = (l + 0.5) * laneW;
        const isHolding = this.activeHolds.has(l);
        const glow = this.laneGlows[l] || 0;
        const isPressed = glow > 0.35 || isHolding;

        const targetW = laneW * (isLarge ? 0.98 : 0.80);
        const targetH = isLarge ? 64 : 24;

        ctx.save();
        ctx.fillStyle = isPressed ? 'rgba(0, 242, 254, 0.25)' : 'rgba(0, 0, 0, 0.6)';
        ctx.strokeStyle = isPressed ? '#ff007f' : 'rgba(0, 242, 254, 0.6)';
        ctx.lineWidth = isPressed ? 2.5 : 1.5;
        ctx.shadowBlur = 0;
        ctx.beginPath();
        if (ctx.roundRect) ctx.roundRect(cx - targetW / 2, hitY - targetH / 2, targetW, targetH, isLarge ? 8 : 4);
        else ctx.rect(cx - targetW / 2, hitY - targetH / 2, targetW, targetH);
        ctx.fill();
        ctx.stroke();

        if (this.isPCMode) {
          const kb = this.pcKeybinds || { 0: 'd', 1: 'f', 2: 'j' };
          const keyChar = ((kb[l] || (l === 0 ? 'd' : (l === 1 ? 'f' : 'j'))).toUpperCase());
          ctx.font = '700 12px "Outfit", sans-serif';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillStyle = isPressed ? '#00f2fe' : '#ffffff';
          ctx.fillText(`[ ${keyChar} ]`, cx, hitY + (isLarge ? 46 : 34));
        }
        ctx.restore();
      }
    }

    ctx.restore();
  }

  // Rediseño Total de Flechas Swipe: Aerodinámico, bajo relieve en latón pulido, contenido en la tecla
  renderVectorChevron(ctx, x, y, direction, maxW = 50, maxH = 30) {
    ctx.save();

    let angle = 0;
    if (direction === 'down') angle = Math.PI;
    else if (direction === 'left') angle = -Math.PI / 2;
    else if (direction === 'right') angle = Math.PI / 2;

    ctx.translate(x, y);
    ctx.rotate(angle);

    const effectiveW = (typeof maxW === 'number' && maxW > 0) ? maxW : 60;
    const effectiveH = (typeof maxH === 'number' && maxH > 0) ? maxH : 35;
    const arrowW = Math.max(16, effectiveW * 0.52);
    const arrowH = Math.max(14, effectiveH * 0.55);

    const palette = this.activeSongPalette || (typeof SONG_COLOR_PALETTES !== 'undefined' ? SONG_COLOR_PALETTES.classic : null);
    const neonCol = palette ? (palette.glow || palette.primary) : '#ff00aa';

    // Trazado de flecha limpia estilo Beatstar (punta triangular + cuerpo rectangular)
    const traceArrow = () => {
      const headH = arrowH * 0.55;
      const stemW = arrowW * 0.42;
      const stemH = arrowH * 0.45;
      ctx.beginPath();
      ctx.moveTo(0, -arrowH / 2);
      ctx.lineTo(arrowW / 2, -arrowH / 2 + headH);
      ctx.lineTo(stemW / 2, -arrowH / 2 + headH);
      ctx.lineTo(stemW / 2, arrowH / 2);
      ctx.lineTo(-stemW / 2, arrowH / 2);
      ctx.lineTo(-stemW / 2, -arrowH / 2 + headH);
      ctx.lineTo(-arrowW / 2, -arrowH / 2 + headH);
      ctx.closePath();
    };

    // 1. Resplandor exterior grueso de neón (Exacto a Beatstar)
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    ctx.strokeStyle = hexToRgba(neonCol, 0.95);
    ctx.lineWidth = 4.5;
    traceArrow();
    ctx.stroke();
    ctx.restore();

    // 2. Relleno blanco brillante nítido
    ctx.fillStyle = '#ffffff';
    traceArrow();
    ctx.fill();

    // 3. Borde fino blanco
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 1.2;
    traceArrow();
    ctx.stroke();

    ctx.restore();
  }

  renderNotes(currentTime) {
    const ctx = this.ctx;
    const len = this.notes.length;
    const scrollDur = (Number.isFinite(this.scrollDurationMs) && this.scrollDurationMs > 0) ? this.scrollDurationMs : 1400;
    const is3D = (this.visualDimension !== '2d');
    const isLarge = (this.keyStyle !== 'compact');
    const hitY = Number.isFinite(this.hitLineY) ? this.hitLineY : (this.height * 0.84);
    const laneW = this.width / 3;
    const horizonY = 12;

    for (let i = 0; i < len; i++) {
      const note = this.notes[i];
      if (!note || note.holdCompleted) continue;
      if (note.hit && note.type !== 'hold') continue;
      if (note.missed && !note.holding) continue;
      if (note.processed && !note.holding) continue;

      const lane = Number.isFinite(note.lane)
        ? Math.max(0, Math.min(2, Math.round(note.lane)))
        : (Number.isFinite(note.column) ? Math.max(0, Math.min(2, Math.round(note.column))) : 0);

      const noteT = Number.isFinite(note.timestamp_ms)
        ? note.timestamp_ms
        : (Number.isFinite(note.timeMs)
            ? note.timeMs
            : (Number.isFinite(note.time) ? (note.time > 100 ? note.time : note.time * 1000) : 0));

      if (!Number.isFinite(noteT)) continue;

      const isBeingHeld = Boolean(note.holding && !note.holdCompleted);
      const timeUntilHit = noteT - currentTime;
      if (!Number.isFinite(timeUntilHit)) continue;

      const pHead = 1.0 - timeUntilHit / scrollDur;
      if (pHead < -0.15 || (!isBeingHeld && pHead > 1.25)) continue;

      // Mathematical zero-overlap clamp with next note in same lane (acotado y break temprano)
      let nextSameLaneDiffMs = Infinity;
      const maxSearchJ = Math.min(len, i + 35);
      for (let j = i + 1; j < maxSearchJ; j++) {
        const nextN = this.notes[j];
        if (!nextN || nextN.holdCompleted) continue;
        if (nextN.hit && nextN.type !== 'hold') continue;
        const nextLane = Number.isFinite(nextN.lane) ? Math.round(nextN.lane) : (Number.isFinite(nextN.column) ? Math.round(nextN.column) : 0);
        const nextT = Number.isFinite(nextN.timestamp_ms) ? nextN.timestamp_ms : (Number.isFinite(nextN.timeMs) ? nextN.timeMs : (nextN.time * 1000));
        if (nextT - noteT > scrollDur) break;
        if (nextLane === lane && nextT > noteT) {
          nextSameLaneDiffMs = nextT - noteT;
          break;
        }
      }

      if (is3D) {
        // =========================================================================
        // 3D VINTAGE ACOUSTIC GRAND PIANO (CONICAL PERSPECTIVE)
        // =========================================================================
        const coord = this.getPerspectiveCoord(lane, pHead);
        const maxH3D = nextSameLaneDiffMs < scrollDur
          ? Math.max(26, ((nextSameLaneDiffMs / scrollDur) * (hitY - horizonY) * coord.scale) - 8)
          : Infinity;

        if (note.type === 'hold') {
          const rawDur = Number.isFinite(note.duration_ms)
            ? note.duration_ms
            : (Number.isFinite(note.holdDuration)
                ? (note.holdDuration > 50 ? note.holdDuration : note.holdDuration * 1000)
                : (Number.isFinite(note.duration) ? (note.duration > 50 ? note.duration : note.duration * 1000) : 700));
          const holdDuration = Math.max(150, Number.isFinite(rawDur) ? rawDur : 700);
          const endT = Number.isFinite(note.end_timestamp_ms) ? note.end_timestamp_ms : (noteT + holdDuration);

          let currentHeadP = isBeingHeld ? 1.0 : pHead;
          let currentTailP = 1.0 - (endT - currentTime) / scrollDur;

          if (currentTailP > 1.25 || currentHeadP < -0.2) continue;

          ctx.save();

          const segments = 16;
          const stringPoints = [];
          for (let s = 0; s <= segments; s++) {
            const frac = s / segments;
            const pStep = currentTailP + (currentHeadP - currentTailP) * frac;
            const ptCoord = this.getPerspectiveCoord(lane, pStep);

          const standingEnvelope = Math.sin(Math.PI * frac);
          const timeSec = currentTime / 1000;
          const vibration = isBeingHeld 
            ? (Math.sin(timeSec * 30.0 + ptCoord.y * 0.10) * (6.0 * standingEnvelope * ptCoord.scale))
            : (Math.sin(timeSec * 6.0 + ptCoord.y * 0.05) * (1.2 * standingEnvelope * ptCoord.scale));

          stringPoints.push({
            x: ptCoord.x + vibration,
            y: ptCoord.y,
            scale: ptCoord.scale,
            laneW: ptCoord.laneW
          });
        }

        // 1. Beatstar Neon Translucent Energy Ribbon (Colores Vívidos e Hiper-Exagerados)
        const palette = this.activeSongPalette || (typeof SONG_COLOR_PALETTES !== 'undefined' ? SONG_COLOR_PALETTES.classic : null);
        const holdCol = palette ? (palette.primary || '#00f2fe') : '#00f2fe';
        const holdGlow = palette ? (palette.glow || '#ff00aa') : '#ff00aa';

        ctx.save();
        ctx.globalCompositeOperation = 'lighter';

        // A. Fondo de halo translúcido con gradiente de alta energía ultra-vívido
        const trailGrad = ctx.createLinearGradient(0, stringPoints[0].y, 0, stringPoints[stringPoints.length - 1].y);
        trailGrad.addColorStop(0.0, hexToRgba(holdCol, 0.25));
        trailGrad.addColorStop(0.35, isBeingHeld ? hexToRgba(holdCol, 0.75) : hexToRgba(holdCol, 0.50));
        trailGrad.addColorStop(0.70, isBeingHeld ? hexToRgba(holdGlow, 0.85) : hexToRgba(holdGlow, 0.60));
        trailGrad.addColorStop(1.0, isBeingHeld ? '#ffffff' : hexToRgba(holdCol, 0.90));
        
        ctx.beginPath();
        for (let s = 0; s < stringPoints.length; s++) {
          const pt = stringPoints[s];
          const wave = Math.sin((pt.y * 0.04) - (currentTime * 0.008)) * (2.4 * pt.scale);
          const halfW = Math.max(4, (pt.laneW * 0.40) + wave);
          if (s === 0) ctx.moveTo(pt.x - halfW, pt.y);
          else ctx.lineTo(pt.x - halfW, pt.y);
        }
        for (let s = stringPoints.length - 1; s >= 0; s--) {
          const pt = stringPoints[s];
          const wave = Math.sin((pt.y * 0.04) - (currentTime * 0.008)) * (2.4 * pt.scale);
          const halfW = Math.max(4, (pt.laneW * 0.40) + wave);
          ctx.lineTo(pt.x + halfW, pt.y);
        }
        ctx.closePath();
        ctx.fillStyle = trailGrad;
        ctx.fill();

        // B. Pulsos de energía diamantinos viajando a lo largo del listón (Traveling Energy Nodes)
        const pulseCycle = (currentTime * 0.003) % 1.0;
        for (let pIdx = 0; pIdx < 3; pIdx++) {
          const pFrac = (pulseCycle + pIdx * 0.33) % 1.0;
          const ptIdx = Math.min(stringPoints.length - 1, Math.floor(pFrac * (stringPoints.length - 1)));
          const pulsePt = stringPoints[ptIdx];
          if (pulsePt) {
            const pRad = (isBeingHeld ? 8.5 : 5.5) * pulsePt.scale;
            ctx.fillStyle = '#ffffff';
            ctx.beginPath();
            ctx.arc(pulsePt.x, pulsePt.y, pRad, 0, Math.PI * 2);
            ctx.fill();

            ctx.strokeStyle = holdGlow;
            ctx.lineWidth = 2.4;
            ctx.beginPath();
            ctx.arc(pulsePt.x, pulsePt.y, pRad * 1.8, 0, Math.PI * 2);
            ctx.stroke();
          }
        }

        // C. Lluvia continua de brillantitos y estrellas diamante al mantener pulsado
        if (isBeingHeld) {
          const headPoint = stringPoints[stringPoints.length - 1];
          if (this.particles && this.particles.emitHoldSpark) {
            this.particles.emitHoldSpark(headPoint.x, hitY, holdCol);
          }
        }

        // D. Raíles laterales de neón en los bordes de la cinta
        ctx.strokeStyle = isBeingHeld ? hexToRgba(holdGlow, 1.0) : hexToRgba(holdGlow, 0.75);
        ctx.lineWidth = 4.2 * stringPoints[stringPoints.length - 1].scale;
        ctx.beginPath();
        for (let s = 0; s < stringPoints.length; s++) {
          const pt = stringPoints[s];
          const wave = Math.sin((pt.y * 0.04) - (currentTime * 0.008)) * (2.4 * pt.scale);
          const halfW = Math.max(4, (pt.laneW * 0.40) + wave);
          if (s === 0) ctx.moveTo(pt.x - halfW, pt.y);
          else ctx.lineTo(pt.x - halfW, pt.y);
        }
        ctx.stroke();

        ctx.beginPath();
        for (let s = 0; s < stringPoints.length; s++) {
          const pt = stringPoints[s];
          const wave = Math.sin((pt.y * 0.04) - (currentTime * 0.008)) * (2.4 * pt.scale);
          const halfW = Math.max(4, (pt.laneW * 0.40) + wave);
          if (s === 0) ctx.moveTo(pt.x + halfW, pt.y);
          else ctx.lineTo(pt.x + halfW, pt.y);
        }
        ctx.stroke();

        // E. Espina dorsal de láser central de alta tensión
        ctx.strokeStyle = hexToRgba(holdCol, 1.0);
        ctx.lineWidth = 5.2 * stringPoints[stringPoints.length - 1].scale;
        ctx.beginPath();
        for (let s = 0; s < stringPoints.length; s++) {
          if (s === 0) ctx.moveTo(stringPoints[s].x, stringPoints[s].y);
          else ctx.lineTo(stringPoints[s].x, stringPoints[s].y);
        }
        ctx.stroke();

        // Núcleo blanco incandescente de plasma
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 2.4 * stringPoints[stringPoints.length - 1].scale;
        ctx.stroke();
        ctx.restore();

        // F. CAPUCHÓN TERMINAL ULTRA-VISIBLE: GEMA BRILLANTE Y CORONA ("FIN DEL HOLD")
        const tailPt = stringPoints[0];
        ctx.save();
        ctx.globalCompositeOperation = 'lighter';
        const pinRad = (isLarge ? 11 : 7.5) * tailPt.scale;

        // 1. Halo expansivo de alerta visual
        const haloGrad = ctx.createRadialGradient(tailPt.x, tailPt.y, 2, tailPt.x, tailPt.y, pinRad * 2.8);
        haloGrad.addColorStop(0.0, '#ffffff');
        haloGrad.addColorStop(0.35, hexToRgba(holdGlow, 0.90));
        haloGrad.addColorStop(0.70, hexToRgba(holdCol, 0.50));
        haloGrad.addColorStop(1.0, 'rgba(0, 0, 0, 0)');
        ctx.fillStyle = haloGrad;
        ctx.beginPath();
        ctx.arc(tailPt.x, tailPt.y, pinRad * 2.8, 0, Math.PI * 2);
        ctx.fill();

        // 2. Anillo exterior dorado / neón con muescas de precisión
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = Math.max(1.6, 3.2 * tailPt.scale);
        ctx.beginPath();
        ctx.arc(tailPt.x, tailPt.y, pinRad * 1.5, 0, Math.PI * 2);
        ctx.stroke();

        ctx.strokeStyle = holdGlow;
        ctx.lineWidth = Math.max(1.2, 2.4 * tailPt.scale);
        ctx.beginPath();
        ctx.arc(tailPt.x, tailPt.y, pinRad * 1.9, 0, Math.PI * 2);
        ctx.stroke();

        // 3. Estrella diamante facetada ✦ giratoria en el centro del fin del hold
        const starRot = currentTime * 0.004;
        ctx.save();
        ctx.translate(tailPt.x, tailPt.y);
        ctx.rotate(starRot);
        const sOuter = pinRad * 1.7;
        const sInner = pinRad * 0.42;
        ctx.beginPath();
        for (let pt = 0; pt < 8; pt++) {
          const rCur = (pt % 2 === 0) ? sOuter : sInner;
          const aCur = (pt / 8) * Math.PI * 2;
          const px = Math.cos(aCur) * rCur;
          const py = Math.sin(aCur) * rCur;
          if (pt === 0) ctx.moveTo(px, py);
          else ctx.lineTo(px, py);
        }
        ctx.closePath();
        ctx.fillStyle = '#ffffff';
        ctx.fill();
        ctx.restore();

        // 4. Barra transversal / Cresta de terminación brillante en el ancho del carril
        const barW = Math.max(12, (tailPt.laneW * 0.42));
        const barGrad = ctx.createLinearGradient(tailPt.x - barW, tailPt.y, tailPt.x + barW, tailPt.y);
        barGrad.addColorStop(0.0, 'rgba(255, 255, 255, 0)');
        barGrad.addColorStop(0.5, '#ffffff');
        barGrad.addColorStop(1.0, 'rgba(255, 255, 255, 0)');
        ctx.strokeStyle = barGrad;
        ctx.lineWidth = Math.max(2.2, 4.2 * tailPt.scale);
        ctx.beginPath();
        ctx.moveTo(tailPt.x - barW, tailPt.y);
        ctx.lineTo(tailPt.x + barW, tailPt.y);
        ctx.stroke();

        ctx.restore();

          // Head Ivory Piano Key
          const headPt = stringPoints[stringPoints.length - 1];
          const headH = Math.min((isLarge ? 80 : 30) * headPt.scale, maxH3D);
          this.drawIvoryKey(ctx, lane, headPt.y, headH, headPt.scale, isBeingHeld, isLarge, false);

          ctx.restore();

        } else if (note.type === 'swipe') {
          const h = Math.min((isLarge ? 84 : 32) * coord.scale, maxH3D);
          const dir = note.direction || 'up';

          // Seguimiento interactivo: la flecha se mueve en tiempo real con el dedo del jugador
          let dragX = 0;
          let dragY = 0;
          for (const [tId, drag] of this.activeSwipeDrags.entries()) {
            if (drag && drag.lane === lane) {
              dragX = drag.dx * 0.75;
              dragY = drag.dy * 0.75;
              break;
            }
          }

          ctx.save();
          const swipeKey = this.drawIvoryKey(ctx, lane, coord.y, h, coord.scale, false, isLarge, true);
          this.renderVectorChevron(ctx, swipeKey.cx + dragX, swipeKey.cy + dragY, dir, swipeKey.w, swipeKey.h);
          ctx.restore();

        } else {
          // Tap Note
          const h = Math.min((isLarge ? 80 : 30) * coord.scale, maxH3D);

          ctx.save();
          this.drawIvoryKey(ctx, lane, coord.y, h, coord.scale, false, isLarge, false);
          ctx.restore();
        }

      } else {
        // ==========================================
        // 2D NEÓN CLÁSICO (Modo Plano)
        // ==========================================
        const cx = (lane + 0.5) * laneW;
        const w = laneW * (isLarge ? 0.98 : 0.80);
        const maxH2D = nextSameLaneDiffMs < scrollDur
          ? Math.max(24, ((nextSameLaneDiffMs / scrollDur) * hitY) - 8)
          : Infinity;

        if (note.type === 'hold') {
          const rawDur = Number.isFinite(note.duration_ms)
            ? note.duration_ms
            : (Number.isFinite(note.holdDuration)
                ? (note.holdDuration > 50 ? note.holdDuration : note.holdDuration * 1000)
                : (Number.isFinite(note.duration) ? (note.duration > 50 ? note.duration : note.duration * 1000) : 700));
          const holdDuration = Math.max(150, Number.isFinite(rawDur) ? rawDur : 700);
          const endT = Number.isFinite(note.end_timestamp_ms) ? note.end_timestamp_ms : (noteT + holdDuration);

          const currentHeadY = isBeingHeld ? hitY : (hitY * pHead);
          const currentTailY = hitY * (1.0 - (endT - currentTime) / scrollDur);

          if (currentTailY > hitY + 30 || currentHeadY < -20) continue;

          // Vertical Neon Ribbon
          ctx.save();
          const ribbonGrad = ctx.createLinearGradient(0, currentTailY, 0, currentHeadY);
          ribbonGrad.addColorStop(0.0, 'rgba(0, 242, 254, 0.3)');
          ribbonGrad.addColorStop(0.5, 'rgba(0, 242, 254, 0.6)');
          ribbonGrad.addColorStop(1.0, '#00f2fe');

          ctx.fillStyle = ribbonGrad;
          const ribbonW = w * 0.45;
          ctx.fillRect(cx - ribbonW / 2, currentTailY, ribbonW, Math.max(4, currentHeadY - currentTailY));

          ctx.strokeStyle = '#ffffff';
          ctx.lineWidth = 1;
          ctx.strokeRect(cx - ribbonW / 2, currentTailY, ribbonW, Math.max(4, currentHeadY - currentTailY));
          ctx.restore();

          const h = Math.min(isLarge ? 80 : 28, maxH2D);
          this.draw2DNeonKey(ctx, cx, currentHeadY, w, h, isBeingHeld, isLarge);

        } else if (note.type === 'swipe') {
          const cy = hitY * pHead;
          const h = Math.min(isLarge ? 98 : 36, maxH2D);
          this.draw2DNeonKey(ctx, cx, cy, w, h, false, isLarge);
          this.renderVectorChevron(ctx, cx, cy, note.direction || 'up', w, h);

        } else {
          const cy = hitY * pHead;
          const h = Math.min(isLarge ? 80 : 28, maxH2D);
          this.draw2DNeonKey(ctx, cx, cy, w, h, false, isLarge);
        }
      }
    }
  }

  renderJudgements() {
    const ctx = this.ctx;
    const len = this.judgements.length;
    if (len === 0) return;

    ctx.save();
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    for (let i = 0; i < len; i++) {
      const j = this.judgements[i];
      if (!j || j.alpha <= 0.01) continue;

      const alpha = Math.max(0, Math.min(1, j.alpha));
      ctx.globalAlpha = alpha;

      const isPerfectPlus = j.text.includes('PERFECT+');
      const isPerfect = j.text === 'PERFECT';
      const isGreat = j.text.includes('GREAT');
      const isGood = j.text.includes('GOOD');
      const isMiss = j.text.includes('MISS');

      let textColor = j.color || '#00f5a0';
      let coreColor = '#ffffff';

      if (isPerfectPlus) {
        textColor = '#00f5a0'; // Verde menta eléctrico incandescente Beatstar
        coreColor = '#ffffff';
      } else if (isPerfect) {
        textColor = '#ffb800'; // Amarillo dorado radiante Beatstar
        coreColor = '#fff6d6';
      } else if (isGreat) {
        textColor = '#00d2fe'; // Azul cian eléctrico
        coreColor = '#e0faff';
      } else if (isGood) {
        textColor = '#c084fc'; // Violeta neón suave
        coreColor = '#f3e8ff';
      } else if (isMiss) {
        textColor = '#ff3366'; // Rojo carmesí neón
        coreColor = '#ffe4ea';
      }

      const drawX = (typeof j.x === 'number') ? j.x : (this.width / 2);
      const fontSize = Math.round((isPerfectPlus ? 24 : 22) * j.scale);
      ctx.font = `900 ${fontSize}px "Outfit", "Montserrat", system-ui, -apple-system, sans-serif`;

      // 1. Haz de Luz Anamórfico Horizontal (Signature Beatstar dopamine burst en PERFECT+)
      if (isPerfectPlus && alpha > 0.2) {
        ctx.save();
        ctx.globalCompositeOperation = 'lighter';
        const flareW = Math.min(180, 120 * j.scale);
        const flareH = Math.max(6, 12 * j.scale);
        const flareGrad = ctx.createLinearGradient(drawX - flareW, j.y, drawX + flareW, j.y);
        flareGrad.addColorStop(0.0, 'rgba(0, 245, 160, 0)');
        flareGrad.addColorStop(0.35, hexToRgba('#00f5a0', alpha * 0.45));
        flareGrad.addColorStop(0.50, hexToRgba('#ffffff', alpha * 0.85));
        flareGrad.addColorStop(0.65, hexToRgba('#00f5a0', alpha * 0.45));
        flareGrad.addColorStop(1.0, 'rgba(0, 245, 160, 0)');
        ctx.fillStyle = flareGrad;
        ctx.fillRect(drawX - flareW, j.y - flareH / 2, flareW * 2, flareH);

        // Núcleo blanco fino de ultra energía
        ctx.strokeStyle = `rgba(255, 255, 255, ${(alpha * 0.9).toFixed(2)})`;
        ctx.lineWidth = 1.6;
        ctx.beginPath();
        ctx.moveTo(drawX - flareW * 0.6, j.y);
        ctx.lineTo(drawX + flareW * 0.6, j.y);
        ctx.stroke();
        ctx.restore();
      }

      // 2. Halo difuso exterior para legibilidad y energía
      ctx.save();
      ctx.shadowColor = textColor;
      ctx.shadowBlur = isPerfectPlus ? 14 : 8;

      // 3. Contorno grueso obsidiana ultra nítido
      ctx.strokeStyle = '#040207';
      ctx.lineWidth = 5.5;
      ctx.strokeText(j.text, drawX, j.y);

      // 4. Relleno con el color de juicio vibrante
      ctx.fillStyle = textColor;
      ctx.fillText(j.text, drawX, j.y);
      ctx.restore();

      // 5. Núcleo interior brillante fino para notas críticas (PERFECT+ / PERFECT)
      if (isPerfectPlus || isPerfect) {
        ctx.save();
        ctx.globalCompositeOperation = 'lighter';
        ctx.font = `900 ${Math.round(fontSize * 0.94)}px "Outfit", "Montserrat", system-ui, -apple-system, sans-serif`;
        ctx.fillStyle = coreColor;
        ctx.fillText(j.text, drawX, j.y);
        ctx.restore();
      }
    }
    ctx.restore();
  }

  startLoop() {
    if (this.animFrameId) {
      cancelAnimationFrame(this.animFrameId);
      this.animFrameId = null;
    }
    this.isRunning = true;
    let lastTime = performance.now();

    const loop = (now) => {
      if (!this.isRunning || this.isPaused || this.isRewinding) {
        this.animFrameId = null;
        return;
      }
      // Uncapped high-refresh-rate delta calculation (60Hz, 90Hz, 120Hz, 144Hz)
      const dt = Math.min(0.05, Math.max(0.001, (now - lastTime) / 1000));
      lastTime = now;

      try {
        this.update(dt);
        this.render();
      } catch (err) {
        console.error('Error inside render loop:', err);
      }

      this.animFrameId = requestAnimationFrame(loop);
    };
    this.animFrameId = requestAnimationFrame(loop);
  }

  onAudioReady() {
    console.log("Audio track ready and buffered.");
  }

  onAudioEnded() {
    console.log("Audio track finished.");
    if (!this.isGameOver && this.beatmapData) {
      setTimeout(() => {
        this.triggerGameEnd();
      }, 400);
    }
  }

  onAudioError(msg) {
    console.warn("Audio sync error notification:", msg);
  }
}

window.BeatstarEngine = BeatstarEngine;
window.DirectAudioSync = DirectAudioSync;
window.ParticleSystem = ParticleSystem;
window.HighFidelityAudioPlayer = HighFidelityAudioPlayer;
